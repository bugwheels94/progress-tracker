export async function postStringToDrive({
  json,
  accessToken,
  fileName,
  fileId,
}: {
  json: string;
  accessToken: string;
  fileName: string;
  fileId?: string; // Optional fileId for updating an existing file
}) {
  const metadata = {
    name: fileName,
    mimeType: "application/json",
  };

  const jsonData = json;
  const file = new Blob([jsonData], { type: "application/json" });

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", file);

  // Determine the URL based on whether we're updating or creating a file
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(url, {
    method: fileId ? "PATCH" : "POST", // PATCH for update, POST for new
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const result = await response.json();
}

export async function getFileFromDrive({
  accessToken,
  fileName,
}: {
  accessToken: string;
  fileName: string;
}) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  if (!data.files?.length) return { data: [], fileId: null }; // Return null if no files found
  const id = data.files[0].id; // Return the first matching file ID
  const response2 = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const json = await response2.json();
  return { data: json, fileId: id };
}
