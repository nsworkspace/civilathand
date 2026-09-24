import { Db, GridFSBucket, ObjectId } from "mongodb";

export const STUDY_MATERIAL_PAYMENT_PREFIX = "study-material-";
export const MAX_STUDY_MATERIAL_SIZE = 25 * 1024 * 1024;

export function studyMaterialPaymentSlug(id: string) {
  return `${STUDY_MATERIAL_PAYMENT_PREFIX}${id}`;
}

export function studyMaterialBucket(db: Db) {
  return new GridFSBucket(db, { bucketName: "study_material_files", chunkSizeBytes: 255 * 1024 });
}

export async function deleteGridFsFile(db: Db, fileId: string | ObjectId) {
  try {
    await studyMaterialBucket(db).delete(typeof fileId === "string" ? new ObjectId(fileId) : fileId);
  } catch (error: any) {
    if (error?.code !== 26) throw error;
  }
}
