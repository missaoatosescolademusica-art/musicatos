export async function uploadToTebi(
  file: Buffer | Blob | string,
  key: string,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const bucket = process.env.TEBI_BUCKET_NAME || "musicatos-resources";
  const accessKey = process.env.TEBI_API_KEY;
  const secretKey = process.env.TEBI_SECRET_KEY || process.env.TEBI_API_SECRET;

  if (!accessKey || !secretKey) {
    throw new Error(
      "TEBI_API_KEY and TEBI_SECRET_KEY (or TEBI_API_SECRET) must be defined",
    );
  }

  // URL format: https://<bucket>.datastream.tebi.io/<key>
  const url = `https://${bucket}.datastream.tebi.io/${key}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `TB-PLAIN ${accessKey}:${secretKey}`,
      "Content-Type": contentType,
    },
    body: file as any,
    // @ts-ignore - duplex is required for some node fetch implementations with streams/buffers
    duplex: "half",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Tebi Upload Error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return {
    key,
    url: `https://s3.tebi.io/${bucket}/${key}`,
  };
}

export async function deleteFromTebi(key: string): Promise<void> {
  const bucket = process.env.TEBI_BUCKET_NAME || "musicatos-resources";
  const accessKey = process.env.TEBI_API_KEY;
  const secretKey = process.env.TEBI_SECRET_KEY || process.env.TEBI_API_SECRET;

  // Note: The context article only covered PUT via DataStream.
  // We'll attempt DELETE via the same endpoint as a best-effort.
  // If DataStream doesn't support DELETE, this might fail.
  if (!accessKey || !secretKey) return;

  try {
    const url = `https://${bucket}.datastream.tebi.io/${key}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `TB-PLAIN ${accessKey}:${secretKey}`,
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to delete from Tebi: ${response.status} ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error("Error deleting from Tebi:", error);
  }
}
