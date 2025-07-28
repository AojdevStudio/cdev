// Simple test transform
module.exports = function transformer(fileInfo, api) {
  console.log(`Processing: ${fileInfo.path}`);
  return null; // No changes
};
