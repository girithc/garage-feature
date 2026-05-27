import { getPhotoById, listPhotosByListingId } from "@/server/demo/demoStore";

export async function getListingPhotos(listingId: string) {
  return listPhotosByListingId(listingId);
}

export async function getPhoto(photoId: string) {
  return getPhotoById(photoId);
}
