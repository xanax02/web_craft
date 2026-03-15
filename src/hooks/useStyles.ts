"use client";
import { useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../convex/_generated/api";

export interface MoodBoardImages {
  id: string;
  file?: File;
  preview: string;
  storageId?: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
  url?: string;
  isFromServer?: boolean;
}

interface StylesFromData {
  images: MoodBoardImages[];
}

export const useMoodBoard = (guideImages: MoodBoardImages[]) => {
  const [dragActive, setDragActive] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const form = useForm<StylesFromData>({
    defaultValues: {
      images: [],
    },
  });

  const { watch, setValue, getValues } = form;
  const images = watch("images");

  const generateUploadUrl = useMutation(api.moodboard.generateUploadUrl);
  const removeMoodBoardImage = useMutation(api.moodboard.removeMoodBoardImage);

  useEffect(() => {
    if (guideImages && guideImages.length > 0) {
      //get server images
      const serverImages: MoodBoardImages[] = guideImages.map((img: any) => ({
        id: img.id,
        preview: img.url,
        storageId: img.storageId,
        uploaded: true,
        uploading: false,
        url: img.url,
        isFromServer: true,
      }));

      const currentImages = getValues("images");

      if (currentImages.length === 0) {
        setValue("images", serverImages);
      } else {
        const mergedImages = [...currentImages];

        serverImages.forEach((serverImg) => {
          const clientIndex = mergedImages.findIndex(
            (clientImg) => clientImg.storageId === serverImg.storageId,
          );
          if (clientIndex !== -1) {
            //clean up old blob url if exist
            if (mergedImages[clientIndex].preview.startsWith("blob:")) {
              URL.revokeObjectURL(mergedImages[clientIndex].preview);
            }

            //replace with server image
            mergedImages[clientIndex] = serverImg;
          }
        });
        setValue("images", mergedImages);
      }
    }
  }, [guideImages, setValue, getValues]);
};
