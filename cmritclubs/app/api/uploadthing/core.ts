import { createUploadthing, type FileRouter } from "uploadthing/next";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
  media: f({ image: { maxFileSize: "2MB", maxFileCount: 1 }, pdf: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async (req) => {
      // Get the authorization header
      const headersList = headers();
      const authorization = (await headersList).get("authorization");
      
      // For now, we'll allow uploads without strict auth verification
      // You can add Firebase admin verification here if needed
      
      return { uploadedBy: "firebase-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.uploadedBy);
      console.log("File URL:", file.ufsUrl);
      
      // Return the file URL so it can be used by the client
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;