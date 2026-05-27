import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadsDirectory = path.join(process.cwd(), "public", "uploads");

export async function saveUploadedFile(file: File) {
  await mkdir(uploadsDirectory, { recursive: true });

  const extension = path.extname(file.name) || ".jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(uploadsDirectory, fileName);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  return {
    fileName,
    publicUrl: `/uploads/${fileName}`
  };
}
