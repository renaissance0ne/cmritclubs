import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";
import { headers } from "next/headers";
import { admin, db } from "@/lib/firebase-admin"; // Make sure this path is correct

// Initialize UploadThing and UTApi
const f = createUploadthing();
export const utapi = new UTApi();

/**
 * @name getUser
 * @description A helper function to authenticate the user using the Firebase ID token.
 * The token is expected to be in the 'Authorization' header as a Bearer token.
 * @returns The decoded user token or null if authentication fails.
 */
const getUser = async () => {
  // Get the authorization header from the request
  const authHeader = (await headers()).get("authorization");

  // Check if the header exists and is in the correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Extract the token from the header
  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Verify the token using the Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Firebase authentication error:", error);
    // Return null if token verification fails
    return null;
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  /**
   * @name proofOfLeadership
   * @description File route for users to upload their proof of leadership letter during signup.
   * Accepts a single PDF file up to 4MB.
   * Requires the user to be authenticated.
   */
  proofOfLeadership: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
    pdf: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // This code runs on your server before any upload
      const user = await getUser();

      // If the user is not authenticated, throw an error
      if (!user) throw new UploadThingError("Unauthorized: You must be logged in to upload files.");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.uid };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload is complete
      console.log("Proof of leadership uploaded by user:", metadata.userId);
      console.log("File URL:", file.ufsUrl);

      // You can now use the file URL, for example, by updating the user's document in Firestore.
      // Note: The logic in your AuthContext already handles creating the user document.
      // You would typically pass this URL back to the client to be included in the final signup form submission.
      try {
        await db.collection("users").doc(metadata.userId).update({
          letterOfProof: file.ufsUrl,
        });
        console.log("Updated user document with proof letter URL.");
      } catch (error) {
        console.error("Failed to update user document with proof letter:", error);
      }


      // !!! Whatever is returned here is sent to the client-side `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;