import { GoogleGenerativeAI } from '@google/generative-ai';
import PDFParser from 'pdf2json';
import { jsonrepair } from 'jsonrepair';

// Types for extracted content
export interface SectionContent {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  order: number;
}

export interface ExtractedContent {
  abstract: string;
  keywords: string[];
  sections: SectionContent[];
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use gemini-2.5-flash model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Extract plain text from PDF buffer using pdf2json (Node.js native)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData.parserError);
        reject(new Error('Failed to parse PDF'));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          let text = '';
          
          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        // Decode URI-encoded text, fallback to raw if malformed
                        try {
                          text += decodeURIComponent(run.T) + ' ';
                        } catch (decodeError) {
                          // If URI is malformed, use the raw text
                          text += run.T.replace(/%/g, ' ') + ' ';
                        }
                      }
                    }
                  }
                }
                text += '\n\n'; // Add spacing between pages
              }
            }
          }

          if (!text || text.trim().length === 0) {
            reject(new Error('No text could be extracted from PDF'));
          } else {
            resolve(text.trim());
          }
        } catch (err) {
          console.error('Error processing PDF data:', err);
          reject(new Error('Failed to process PDF text'));
        }
      });

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      reject(new Error('Failed to extract text from PDF'));
    }
  });
}

/**
 * Extract structured content from PDF text using Gemini AI
 */
export async function extractStructuredContent(
  text: string,
  title: string
): Promise<ExtractedContent> {
  try {
    // Truncate text if it's too long
    // Gemini 1.5 Flash supports ~1M tokens, but let's be conservative
    const maxChars = 100000; // Roughly 25,000 tokens
    const truncatedText = text.length > maxChars 
      ? text.substring(0, maxChars) + '\n\n[... content truncated for length ...]'
      : text;

    const prompt = `Analyze this research paper and extract structured content for a blog-style overview that will be displayed on a webpage.

Title: ${title}

Full Text:
${truncatedText}

IMPORTANT GUIDELINES:
- Extract ONLY narrative text content - no URLs, links, or web addresses
- Ignore all figure references, diagram descriptions, charts, and tables
- Skip citations like [1], [2], (Smith et al., 2020)
- Don't include phrases like "see Figure X" or "as shown in Table Y"
- Write in clear, flowing prose suitable for reading online
- Make content accessible to students and general academic audiences
- Highlight practical applications and real-world implications
- Keep content CONCISE and focused on key insights only

Extract:
1. An abstract (80-120 words) - A concise summary of the research and its significance
2. 5-8 relevant keywords (technical terms, methodologies, topics)
3. Main sections (2-4 sections total) with:
   - A kebab-case id (e.g., "key-findings")
   - Clear section title
   - 1-2 sentence narrative summary (brief and focused)
   - 2-3 key points as complete sentences (most critical insights only)
   - Order number (starting from 1)

Focus on the most important discoveries and their practical implications. Be concise.`;

    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8000,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            abstract: { type: "string" },
            keywords: { 
              type: "array",
              items: { type: "string" }
            },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  summary: { type: "string" },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" }
                  },
                  order: { type: "number" }
                },
                required: ["id", "title", "summary", "keyPoints", "order"]
              }
            }
          },
          required: ["abstract", "keywords", "sections"]
        } as any,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) {
      throw new Error('No content received from Gemini');
    }

    // Clean up response - remove markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Try to extract JSON if it's embedded in other text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let parsed: ExtractedContent;
    try {
      // First try to repair the JSON
      const repairedJson = jsonrepair(jsonText);
      parsed = JSON.parse(repairedJson);
    } catch (parseError) {
      // Log the problematic JSON for debugging
      console.error('Failed to parse JSON. Length:', jsonText.length);
      console.error('First 500 chars:', jsonText.substring(0, 500));
      console.error('Last 500 chars:', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // Try to find the error position from different error message formats
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      const posMatch = errorMsg.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.error(`\nJSON around error position ${pos}:`);
        console.error(jsonText.substring(Math.max(0, pos - 200), Math.min(jsonText.length, pos + 200)));
      }
      
      // Log full JSON to file for debugging (only first 5000 chars to avoid overwhelming console)
      console.error('\n=== MALFORMED JSON (first 5000 chars) ===');
      console.error(jsonText.substring(0, 5000));
      console.error('=== END SAMPLE ===\n');
      
      throw parseError;
    }

    // Validate the response structure
    if (!parsed.abstract || !parsed.keywords || !parsed.sections) {
      console.error('Invalid structure. Received:', JSON.stringify(parsed, null, 2));
      console.error('Missing fields:', {
        hasAbstract: !!parsed.abstract,
        hasKeywords: !!parsed.keywords,
        hasSections: !!parsed.sections
      });
      throw new Error('Invalid response structure from Gemini');
    }

    // Ensure sections have all required fields
    parsed.sections = parsed.sections.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      title: section.title || `Section ${index + 1}`,
      summary: section.summary || '',
      keyPoints: section.keyPoints || [],
      order: section.order || index + 1,
    }));

    return parsed;

  } catch (error) {
    console.error('Error extracting structured content:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      throw new Error(`Failed to extract structured content: ${error.message}`);
    }
    
    throw new Error('Failed to extract structured content from PDF text');
  }
}

/**
 * Complete PDF analysis pipeline
 * Extracts text from PDF and then extracts structured content
 */
export async function analyzePDF(
  pdfBuffer: Buffer,
  title: string
): Promise<ExtractedContent> {
  try {
    // Step 1: Extract raw text
    const text = await extractTextFromPDF(pdfBuffer);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF');
    }

    // Step 2: Extract structured content using AI
    const structuredContent = await extractStructuredContent(text, title);
    
    return structuredContent;

  } catch (error) {
    console.error('Error in PDF analysis pipeline:', error);
    throw error;
  }
}
