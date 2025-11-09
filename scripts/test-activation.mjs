#!/usr/bin/env node

/**
 * Test Script for Activation Email
 * 
 * This script tests both the email service directly and the student activation endpoint
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Utility function to print section headers
function printHeader(text) {
  console.log('\n' + '='.repeat(50));
  console.log(text);
  console.log('='.repeat(50));
}

// Utility function to handle response
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      // Try to parse as JSON
      const json = await response.json();
      return { ok: response.ok, status: response.status, data: json };
    } catch (error) {
      // If JSON parsing fails, get the text
      const text = await response.text();
      return { 
        ok: false, 
        status: response.status, 
        error: `Failed to parse JSON: ${error.message}`, 
        rawResponse: text 
      };
    }
  } else {
    // For non-JSON responses, get the text
    const text = await response.text();
    return { 
      ok: response.ok, 
      status: response.status, 
      rawResponse: text 
    };
  }
}

// Test the email service directly
async function testEmailService() {
  printHeader('Testing Email Service Directly');
  
  const testData = {
    email: "test@example.com",
    name: "Test Student",
    token: `test-token-${Date.now()}`,
    role: "STUDENT"
  };
  
  console.log('POST /api/jobs/send-activation-email');
  console.log('Request Body:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/jobs/send-activation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await handleResponse(response);
    console.log('Status:', result.status);
    
    if (result.ok) {
      console.log('✅ Email service test successful!');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Email service test failed!');
      if (result.data) {
        console.log('Error:', JSON.stringify(result.data, null, 2));
      }
      if (result.rawResponse) {
        console.log('Raw Response:', result.rawResponse);
      }
    }
    
    return result.ok;
  } catch (error) {
    console.log('❌ Email service test failed with exception!');
    console.log('Error:', error);
    return false;
  }
}

// Test the student activation endpoint
async function testStudentActivation() {
  printHeader('Testing Student Activation Endpoint');
  
  // Find a student ID to test with
  console.log('Getting students to find test ID...');
  let studentId;
  
  try {
    const studentsResponse = await fetch('http://localhost:3000/api/test-db');
    const result = await handleResponse(studentsResponse);
    
    if (result.ok && result.data && result.data.stats && result.data.stats.students > 0) {
      // Use ID 1 for testing if we have students
      studentId = 1;
      console.log(`Found ${result.data.stats.students} students, using ID: ${studentId}`);
    } else {
      console.log('No students found or could not access database. Using default ID 1');
      studentId = 1;
    }
  } catch (error) {
    console.log('Error getting students, using default ID 1:', error);
    studentId = 1;
  }
  
  const testData = {
    email: "student@example.com"
  };
  
  console.log(`POST /api/admin/students/${studentId}/send-activation`);
  console.log('Request Body:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/students/${studentId}/send-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await handleResponse(response);
    console.log('Status:', result.status);
    
    if (result.ok) {
      console.log('✅ Student activation test successful!');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Student activation test failed!');
      if (result.data) {
        console.log('Error:', JSON.stringify(result.data, null, 2));
      }
      if (result.rawResponse) {
        console.log('Raw Response:', result.rawResponse);
      }
    }
    
    return result.ok;
  } catch (error) {
    console.log('❌ Student activation test failed with exception!');
    console.log('Error:', error);
    return false;
  }
}

// Test the email test API
async function testActivationEmailAPI() {
  printHeader('Testing Activation Email Test API');
  
  console.log('GET /api/test-activation-email');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-activation-email');
    const result = await handleResponse(response);
    console.log('Status:', result.status);
    
    if (result.ok) {
      console.log('✅ Activation Email Test API successful!');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Activation Email Test API failed!');
      if (result.data) {
        console.log('Error:', JSON.stringify(result.data, null, 2));
      }
      if (result.rawResponse) {
        console.log('Raw Response:', result.rawResponse);
      }
    }
    
    return result.ok;
  } catch (error) {
    console.log('❌ Activation Email Test API failed with exception!');
    console.log('Error:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  printHeader('ACTIVATION EMAIL SYSTEM TESTS');
  
  let results = {
    emailService: false,
    activationEmailAPI: false,
    studentActivation: false,
  };
  
  // Test 1: Email Service
  results.emailService = await testEmailService();
  
  // Test 2: Activation Email Test API
  results.activationEmailAPI = await testActivationEmailAPI();
  
  // Test 3: Student Activation
  results.studentActivation = await testStudentActivation();
  
  // Print summary
  printHeader('TEST RESULTS SUMMARY');
  console.log('Email Service Test:', results.emailService ? '✅ PASSED' : '❌ FAILED');
  console.log('Activation Email API Test:', results.activationEmailAPI ? '✅ PASSED' : '❌ FAILED');
  console.log('Student Activation Test:', results.studentActivation ? '✅ PASSED' : '❌ FAILED');
  
  // Overall result
  const overallSuccess = Object.values(results).every(Boolean);
  console.log('\nOverall Result:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return overallSuccess ? 0 : 1;
}

// Run the tests and exit with appropriate code
runTests()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Test script error:', error);
    process.exit(1);
  });