/**
 * Downloads CMU Dictionary and converts to React Native compatible JSON
 * Run: node scripts/download-cmu-dict.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CMU_DICT_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
const OUTPUT_PATH = path.join(__dirname, '../src/assets/data/cmu_dict_full.json');

console.log('📥 Downloading CMU Dictionary...');

https.get(CMU_DICT_URL, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    console.log('✅ Download complete. Processing...');
    
    const dictionary = {};
    const lines = data.split('\n');
    let processedCount = 0;

    lines.forEach((line) => {
      // Skip comments and empty lines
      if (line.startsWith(';;;') || !line.trim()) {
        return;
      }

      // Parse line: "WORD  P H O N E M E S"
      const match = line.match(/^([^\s]+)\s+(.+)$/);
      if (match) {
        let word = match[1].toLowerCase();
        const phonemes = match[2].trim().split(/\s+/);

        // Handle alternate pronunciations (e.g., "TOMATO(2)")
        // We'll keep only the primary pronunciation
        word = word.replace(/\(\d+\)$/, '');

        // Only store if we don't have this word yet (ignore alternates)
        if (!dictionary[word]) {
          dictionary[word] = phonemes;
          processedCount++;
        }
      }
    });

    console.log(`✅ Processed ${processedCount} words`);
    console.log('💾 Saving to JSON...');

    // Write to JSON file
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary, null, 2));

    // Check file size
    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Complete! Saved to: ${OUTPUT_PATH}`);
    console.log(`📊 File size: ${fileSizeInMB} MB`);
    console.log(`📚 Total words: ${Object.keys(dictionary).length}`);
  });
}).on('error', (err) => {
  console.error('❌ Download failed:', err.message);
  process.exit(1);
});
