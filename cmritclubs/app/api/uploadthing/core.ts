import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { headers } from "next/headers";

const f = createUploadthing();
export const utapi = new UTApi(); // Export a new instance of UTApi

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth, replace with real user auth if needed

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique name
  media: f({ image: { maxFileSize: "2MB", maxFileCount: 1 }, pdf: { maxFileSize: "2MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // For now, we'll allow uploads without strict auth verification for client-side
      // You can add Firebase admin verification here if needed
      return { uploadedBy: "firebase-user" }; 
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for user:", metadata.uploadedBy);
      console.log("file url", file.url);
      
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;