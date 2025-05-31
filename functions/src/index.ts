
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { AxiosResponse } from 'axios'; // Example for typings if using axios

// Initialize Firebase Admin SDK
// This needs to be done only once per functions deployment.
// If you have other functions or initializations, ensure it's not duplicated.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Access your AI API Key from environment variables
// For Firebase v2 functions, you'd typically set this up during deployment
// or use .env files with `dotenv` if running locally for emulation.
// Example: const AI_API_KEY = process.env.AI_API_KEY;
// For older v1 functions.config(): const AI_API_KEY = functions.config().ai?.key;


// --- Helper function to fetch an image from a URL and return as Buffer ---
// This is an example. Your AI API might return a base64 string or a direct buffer.
async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  // You might use a library like 'axios' for this
  // Ensure 'axios' is added to your functions/package.json
  // For example:
  // const axios = require('axios');
  // const response: AxiosResponse<ArrayBuffer> = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  // return Buffer.from(response.data);

  // Placeholder: In a real scenario, you'd fetch the actual image.
  // For this example, let's simulate returning a small transparent PNG buffer
  // to avoid needing external libraries for this skeleton.
  logger.warn("fetchImageAsBuffer: Using placeholder buffer. Implement actual image fetching.");
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );
}


export const generateAiImage = onCall(async (request) => {
  logger.info("generateAiImage function called with data:", request.data);

  if (!request.auth || !request.auth.uid) {
    logger.error("User is not authenticated.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const userId = request.auth.uid;

  const prompt = request.data.prompt;
  if (!(typeof prompt === "string") || prompt.length === 0) {
    logger.error("Invalid prompt received:", prompt);
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'prompt' string in the request data."
    );
  }

  const aspectRatio = request.data.aspectRatio || "1:1";
  let width = 512;
  let height = 512;

  switch (aspectRatio) {
    case "4:5": width = 512; height = 640; break;
    case "16:9": width = 512; height = 288; break;
    case "1:1": default: width = 512; height = 512; break;
  }

  const negativePrompt = request.data.negativePrompt;
  // You might also receive stylePreset, creativity, detailLevel, colorPalette etc. from request.data

  logger.info(`Processing AI image generation for user ${userId}, prompt: "${prompt}"`);

  let generatedImageBuffer: Buffer;
  let contentType: string = 'image/png'; // Default, adjust based on AI API output

  // --- Step 1: Call your chosen AI Image Generation API ---
  try {
    logger.info("Calling external AI Image Generation API...");
    // const aiApiUrl = "YOUR_AI_API_ENDPOINT";
    // const aiApiKey = process.env.AI_API_KEY; // Ensure this is configured in your environment

    // if (!aiApiKey) {
    //   logger.error("AI_API_KEY is not set in environment variables.");
    //   throw new HttpsError("internal", "AI service configuration error.");
    // }

    // Example with a hypothetical API that returns a direct image URL to download
    // const aiApiResponse = await fetch(aiApiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${aiApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt,
    //     negative_prompt: negativePrompt,
    //     aspect_ratio: aspectRatio,
    //     // ... other parameters your AI API expects
    //   }),
    // });

    // if (!aiApiResponse.ok) {
    //   const errorBody = await aiApiResponse.text();
    //   logger.error("AI API Error:", aiApiResponse.status, errorBody);
    //   throw new HttpsError("internal", `AI service failed: ${aiApiResponse.statusText}`);
    // }

    // const responseData = await aiApiResponse.json();
    // const temporaryImageUrlFromAi = responseData.imageUrl; // Or handle base64, etc.
    // logger.info("AI API response received. Image URL:", temporaryImageUrlFromAi);

    // // If API returns an image URL, fetch it as a buffer
    // generatedImageBuffer = await fetchImageAsBuffer(temporaryImageUrlFromAi);
    // contentType = responseData.contentType || 'image/png'; // Get content type if provided

    // --- Placeholder for actual AI API call ---
    logger.warn("Using placeholder for AI API call. Implement actual API integration.");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    // Simulate receiving a buffer (e.g., a small transparent PNG)
    generatedImageBuffer = await fetchImageAsBuffer("placeholder_url_not_actually_used");
    contentType = 'image/png';
    // In a real scenario, width and height might come from the AI API's response
    // or be based on the request parameters. For now, we use the requested aspect ratio.

  } catch (error: any) {
    logger.error("Error during AI API call or image fetching:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to generate image via AI service.");
  }

  // --- Step 2: Upload the generated image to Firebase Cloud Storage ---
  const creationId = admin.firestore().collection('creations').doc().id; // Generate a unique ID
  const imageName = `${creationId}.${contentType.split('/')[1] || 'png'}`; // e.g., creationId.png
  const filePath = `creations/${userId}/${imageName}`;
  const bucket = admin.storage().bucket(); // Default bucket
  const file = bucket.file(filePath);

  try {
    logger.info(`Uploading image to Cloud Storage: ${filePath}`);
    await file.save(generatedImageBuffer, {
      metadata: {
        contentType: contentType,
        metadata: { // Optional: custom metadata
          firebaseStorageDownloadTokens: creationId, // Can be used for simpler public URLs if needed later
          originalPrompt: prompt,
          userId: userId
        }
      },
      // To make the file publicly readable without signed URLs (simpler for client):
      // public: true, // This makes the file directly accessible via its GCS URL if bucket permissions allow
      // resumable: false, // For smaller files, non-resumable can be faster
    });

    // Make the file public if not already done by bucket settings or `public: true` above
    // This is often preferred for images meant to be displayed in an app.
    // Ensure your GCS bucket permissions are set accordingly.
    await file.makePublic();

    const publicUrl = file.publicUrl();
    // Alternative way to construct the URL, especially if not using `makePublic()` or needing a specific format
    // const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    // If you used firebaseStorageDownloadTokens:
    // const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${creationId}`;


    logger.info("Image uploaded successfully. Public URL:", publicUrl);

    return {
      imageUrl: publicUrl,
      creationId: creationId,
      imageWidth: width, // These might be updated if the AI API returns actual dimensions
      imageHeight: height,
    };

  } catch (error: any) {
    logger.error("Error uploading image to Cloud Storage:", error);
    throw new HttpsError("internal", "Failed to store generated image.");
  }
});

    