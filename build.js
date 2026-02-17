const fs = require('fs');
const path = require('path');

function scanDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        filename: file,
        slug: file.replace('.md', '')
      }));
  } catch (e) {
    console.error(`Error scanning ${dirPath}:`, e);
    return [];
  }
}

const projectsDir = path.join(__dirname, 'content', 'projects');
const blogsDir = path.join(__dirname, 'content', 'blogs');
const manifestPath = path.join(__dirname, 'content', 'manifest.json');

const manifest = {
  projects: scanDirectory(projectsDir),
  blogs: scanDirectory(blogsDir)
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest generated successfully!');
console.log(`Projects: ${manifest.projects.length}`);
console.log(`Blogs: ${manifest.blogs.length}`);
