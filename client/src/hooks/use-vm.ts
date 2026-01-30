import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState, useCallback } from "react";

// GET /api/vm
export function useVm() {
  return useQuery({
    queryKey: [api.vm.get.path],
    queryFn: async () => {
      const res = await fetch(api.vm.get.path);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch VM status");
      return api.vm.get.responses[200].parse(await res.json());
    },
    refetchInterval: (data) => (data?.state?.data?.status === "running" ? 2000 : 5000),
  });
}

// POST /api/vm/upload with progress tracking
export function useUploadVmImage() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback((file: File, callbacks?: {
    onSuccess?: (data: { success: boolean; path: string; filename: string }) => void;
    onError?: (error: Error) => void;
  }) => {
    setIsUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        queryClient.invalidateQueries({ queryKey: [api.vm.get.path] });
        callbacks?.onSuccess?.(data);
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          callbacks?.onError?.(new Error(error.message || "Upload failed"));
        } catch {
          callbacks?.onError?.(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => {
      setIsUploading(false);
      callbacks?.onError?.(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      setIsUploading(false);
      callbacks?.onError?.(new Error("Upload aborted"));
    });

    xhr.open(api.vm.upload.method, api.vm.upload.path);
    xhr.send(formData);
  }, [queryClient]);

  return {
    upload,
    progress,
    isUploading,
    resetProgress: () => setProgress(0),
  };
}

// POST /api/vm/start
export function useStartVm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.vm.start.path, {
        method: api.vm.start.method,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = api.vm.start.responses[400].parse(await res.json());
        throw new Error(error.message);
      }
      return api.vm.start.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vm.get.path] });
    },
  });
}

// POST /api/vm/stop
export function useStopVm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.vm.stop.path, {
        method: api.vm.stop.method,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = api.vm.stop.responses[400].parse(await res.json());
        throw new Error(error.message);
      }
      return api.vm.stop.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vm.get.path] });
    },
  });
}
