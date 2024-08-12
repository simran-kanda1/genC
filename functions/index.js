const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const path = require("path");

admin.initializeApp();

exports.triggerPythonScript = functions.storage.object().onFinalize(async (object) => {
  const bucketName = object.bucket;
  const filePath = object.name;
  const fileName = filePath.split('/').pop();

  if (!filePath.startsWith('uploads/')) {
    console.log(`Ignoring file not in 'uploads' folder: ${filePath}`);
    return;
  }

  console.log(`File uploaded: ${filePath}`);

  // Move the uploaded file to the processed folder directly
  const storageClient = admin.storage().bucket(bucketName);
  await storageClient.file(filePath).move(`processed/${fileName}`);
  console.log(`Moved file to processed/${fileName}`);

  // Step 1: Call the process_document_function
  const processDocumentFunctionUrl = 'https://us-central1-generations-calgary.cloudfunctions.net/process_document_function';

  const processDocumentResponse = await fetch(processDocumentFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_file: `processed/${fileName}`,
      output_file: `updated/${fileName}`
    })
  });

  if (!processDocumentResponse.ok) {
    console.error(`Error from process_document_function: ${processDocumentResponse.statusText}`);
    return;
  }

  console.log('Document processed successfully by process_document_function');

  // Step 2: Call the processLogo function
  await triggerLogoFunction(bucketName, fileName);
});

const triggerLogoFunction = async (bucketName, fileName) => {
  const processLogoUrl = 'https://us-central1-generations-calgary.cloudfunctions.net/processLogo';

  const processLogoResponse = await fetch(processLogoUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucketName: bucketName,
      fileName: `updated/${fileName}`
    })
  });

  if (!processLogoResponse.ok) {
    console.error(`Error from processLogo Function: ${processLogoResponse.statusText}`);
    return;
  }

  console.log('Document processed successfully by processLogo function');
};
