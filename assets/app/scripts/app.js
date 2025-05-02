// No imports needed - access the global supabaseClient variable

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App page loaded. Checking for fileId...");

    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('fileId');

    if (fileId) {
        console.log(`File ID found in URL: ${fileId}`);
        await loadAndLogFileContent(fileId);
    } else {
        console.log("No fileId found in URL parameters.");
    }
});

async function loadAndLogFileContent(fileId) {
    try {
        // 1. Get current user session
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
            throw new Error("User session not found. Cannot load file.");
        }
        const userId = session.user.id;
        console.log(`User ID: ${userId}`);

        // 2. Construct file path
        const filePath = `${userId}/${fileId}.json`;
        console.log(`Attempting to download file from storage: ${filePath}`);

        // 3. Download file from Supabase Storage
        const { data: blob, error: downloadError } = await supabaseClient
            .storage
            .from('storage')
            .download(filePath);

        if (downloadError) {
            throw new Error(`Failed to download file: ${downloadError.message}`);
        }

        if (!blob) {
            throw new Error("Downloaded file blob is null or undefined.");
        }

        console.log(`File downloaded successfully (type: ${blob.type}, size: ${blob.size})`);

        // 4. Convert blob to text
        const fileContentText = await blob.text();

        // 5. Log the content
        console.log("--- File Content ---");
        console.log(fileContentText);
        console.log("--------------------");

        // Optional: Parse and log as JSON if you expect JSON content
        try {
            const fileContentJson = JSON.parse(fileContentText);
            console.log("--- Parsed JSON Content ---");
            console.log(fileContentJson);
            console.log("-------------------------");
        } catch (parseError) {
            console.warn("Could not parse file content as JSON:", parseError);
        }

    } catch (error) {
        console.error("Error loading file content:", error);
        alert(`Error loading file: ${error.message}`);
    }
}
