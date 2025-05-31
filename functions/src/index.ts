import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// Removed: import { AxiosResponse } from 'axios'; // No longer needed if axios isn't actively used for typings here

// Import necessary modules for Google Generative AI / Genkit
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Make sure you have this installed: npm install @google/generative-ai // Commented out
// import * as functions from 'firebase-functions'; // Required to access functions.config() // Commented out

// Initialize Firebase Admin SDK
// This needs to be done only once per functions deployment.
// If you have other functions or initializations, ensure it's not duplicated.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

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

// Initialize the Google Generative AI client using the API key
// This is where you use the key set via `firebase functions:config:set gemini.key="..."`
// const genAI = new GoogleGenerativeAI(functions.config().gemini.key); // Commented out to resolve TS6133 error
// const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // This was already commented out
                                                              // Note: Gemini-Pro is a text model. For image generation,
                                                              // you typically need a separate image generation API (like DALL-E, Stable Diffusion, or specific Google image models).
                                                              // This code currently has placeholders for *external* AI Image APIs.

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

  // Removed: const negativePrompt = request.data.negativePrompt; // This was unused
  // If your actual AI Image API (e.g., DALL-E, not Gemini Pro) supports negative prompts,
  // you would uncomment and use this variable in your API call.

  logger.info(`Processing AI image generation for user ${userId}, prompt: "${prompt}"`);

  let generatedImageBuffer: Buffer;
  let contentType: string = 'image/png'; // Default, adjust based on AI API output

  // --- Step 1: Call your chosen AI Image Generation API ---
  try {
    logger.info("Calling external AI Image Generation API...");

    // IMPORTANT: The code below is currently a placeholder for an *external* AI Image Generation API.
    // The `GoogleGenerativeAI` client initialized above (genAI) is for Gemini text models.
    // If you intend to use Google's image generation (e.g., through Imagen or a vision model's capabilities),
    // you'd need to adapt this section. For now, it continues to use the placeholder.

    // const aiApiUrl = "YOUR_AI_API_ENDPOINT"; // e.g., for DALL-E, Stable Diffusion, etc.
    // const aiApiKey = functions.config().gemini.key; // Reusing the same key, but your image API might need a different one!

    // if (!aiApiKey) {
    //   logger.error("AI_API_KEY (Gemini Key) is not set in environment variables.");
    //   throw new HttpsError("internal", "AI service configuration error.");
    // }

    // This section is commented out because it's currently a placeholder for *external* APIs.
    // If you uncomment this, ensure you have the `axios` or `node-fetch` library installed in `functions/package.json`
    // and replace placeholders with your actual AI Image API endpoint and request format.
    // Example with a hypothetical API that returns a direct image URL to download
    // const aiApiResponse = await fetch(aiApiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${aiApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt,
    //     // negative_prompt: negativePrompt, // Only if your chosen image API supports it
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

    // If API returns an image URL, fetch it as a buffer
    // generatedImageBuffer = await fetchImageAsBuffer(temporaryImageUrlFromAi);
    // contentType = responseData.contentType || 'image/png'; // Get content type if provided


    // --- Current Placeholder for actual AI API call ---
    logger.warn("Using placeholder for AI API call. Implement actual API integration for image generation.");
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