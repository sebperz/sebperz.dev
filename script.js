// Portfolio Application State
const state = {
    currentTab: 'home',
    projects: {
        selectedIndex: 0,
        scrollPosition: 0,
        detailOpen: false,
        searchQuery: '',
        items: [],
        contentCache: {}
    },
    blogs: {
        selectedIndex: 0,
        scrollPosition: 0,
        searchQuery: '',
        detailOpen: false,
        items: [],
        contentCache: {}
    },
    loading: true
};

// Tab order for cycling
const tabs = ['home', 'projects', 'blogs'];

// Text strings
const texts = {
    no_results: 'No results found',
    details_description: 'What it is',
    details_learnings: 'What I learned',
    details_improvements: 'What can be improved',
    read_time: 'min read',
    go_back: '<< Go back (Esc or Q)',
    loading: 'Loading...'
};

// DOM Elements
const elements = {
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    projectsContainer: document.getElementById('projectsContainer'),
    blogsContainer: document.getElementById('blogsContainer'),
    projectSearch: document.getElementById('projectSearch'),
    blogSearch: document.getElementById('blogSearch'),
    projectsList: document.getElementById('projectsList'),
    projectsDetail: document.getElementById('projectsDetail'),
    projectsDetailContainer: document.getElementById('projectsDetailContainer'),
    blogsList: document.getElementById('blogsList'),
    blogsDetail: document.getElementById('blogsDetail'),
    blogsDetailContainer: document.getElementById('blogsDetailContainer'),
};

// Simple frontmatter parser
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        return { data: {}, content: content };
    }
    
    const frontmatterStr = match[1];
    const body = match[2];
    const data = {};
    
    frontmatterStr.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
            }
            
            data[key] = value;
        }
    });
    
    return { data, content: body };
}

// Simple markdown to HTML converter for sections
function parseProjectContent(markdown) {
    const sections = {
        whatItIs: '',
        whatILearned: [],
        whatCanBeImproved: []
    };
    
    const lines = markdown.split('\n');
    let currentSection = 'whatItIs';
    let currentContent = [];
    
    lines.forEach(line => {
        if (line.startsWith('## What it is')) {
            currentContent = [];
            currentSection = 'whatItIs';
        } else if (line.startsWith('## What I learned')) {
            sections.whatItIs = currentContent.join('\n').trim();
            currentContent = [];
            currentSection = 'whatILearned';
        } else if (line.startsWith('## What can be improved')) {
            sections.whatILearned = currentContent.filter(l => l.trim()).map(l => l.replace(/^- /, '').trim());
            currentContent = [];
            currentSection = 'whatCanBeImproved';
        } else {
            currentContent.push(line);
        }
    });
    
    if (currentSection === 'whatCanBeImproved') {
        sections.whatCanBeImproved = currentContent.filter(l => l.trim()).map(l => l.replace(/^- /, '').trim());
    }
    
    return sections;
}

// Convert markdown to HTML (simple implementation)
function markdownToHtml(markdown) {
    let html = markdown
        .replace(/^### (.*$)/gm, '<h3 style="color: var(--secondary); margin: 20px 0 12px 0;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h3 style="color: var(--secondary); margin: 20px 0 12px 0;">$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, (match) => {
            if (match.startsWith('<')) return match;
            return `<p>${match}</p>`;
        });
    
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h3)/g, '$1');
    html = html.replace(/(<\/h3>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    
    return html;
}

// Fetch content manifest and load all content
async function loadContentIndex() {
    console.log('Loading content...');
    try {
        const response = await fetch('content/manifest.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status}`);
        }
        const manifest = await response.json();
        console.log('Manifest loaded:', manifest);
        
        // Load all projects
        for (const project of manifest.projects) {
            const filePath = `content/projects/${project.filename}`;
            console.log('Loading project:', filePath);
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
                }
                const markdown = await response.text();
                const { data, content } = parseFrontmatter(markdown);
                const parsed = parseProjectContent(content);
                
                state.projects.items.push({
                    id: data.id,
                    slug: project.slug,
                    name: data.name,
                    description: data.description,
                    tags: data.tags,
                    details: parsed
                });
            } catch (e) {
                console.error(`Failed to load project: ${filePath}`, e);
            }
        }
        
        // Load all blogs
        for (const blog of manifest.blogs) {
            const filePath = `content/blogs/${blog.filename}`;
            console.log('Loading blog:', filePath);
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
                }
                const markdown = await response.text();
                const { data, content } = parseFrontmatter(markdown);
                
                state.blogs.items.push({
                    id: data.id,
                    slug: blog.slug,
                    title: data.title,
                    description: data.description,
                    tags: data.tags,
                    content: content
                });
            } catch (e) {
                console.error(`Failed to load blog: ${filePath}`, e);
            }
        }
        
        // Sort by ID descending (highest ID first)
        state.projects.items.sort((a, b) => b.id - a.id);
        state.blogs.items.sort((a, b) => b.id - a.id);
        
        state.loading = false;
        console.log('Projects loaded:', state.projects.items.length);
        console.log('Blogs loaded:', state.blogs.items.length);
        renderProjects();
        renderBlogs();
        
    } catch (e) {
        console.error('Failed to load content manifest:', e);
        state.loading = false;
        elements.projectsContainer.innerHTML = '<div class="empty-state"><p>Error loading content. Check console for details.</p></div>';
        elements.blogsContainer.innerHTML = '<div class="empty-state"><p>Error loading content. Check console for details.</p></div>';
    }
}

// Content Rendering
function renderProjects(projects = state.projects.items) {
    if (state.loading) {
        elements.projectsContainer.innerHTML = `<div class="empty-state"><p>${texts.loading}</p></div>`;
        return;
    }
    
    if (projects.length === 0) {
        elements.projectsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">¯\\_(ツ)_/¯</div>
                <p>${texts.no_results}</p>
            </div>
        `;
    } else {
        elements.projectsContainer.innerHTML = projects.map((project, index) => `
            <div class="list-item ${index === state.projects.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <div class="item-name">${project.name}</div>
                <div class="item-description">${project.description}</div>
                <div class="item-tags">
                    ${project.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        elements.projectsContainer.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                state.projects.selectedIndex = parseInt(item.dataset.index);
                openProjectDetail();
            });
        });
    }
}

function getFilteredProjects() {
    if (!state.projects.searchQuery) return state.projects.items;
    
    const query = state.projects.searchQuery.toLowerCase();
    return state.projects.items.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query))
    );
}

function renderBlogs(blogs = state.blogs.items) {
    if (state.loading) {
        elements.blogsContainer.innerHTML = `<div class="empty-state"><p>${texts.loading}</p></div>`;
        return;
    }
    
    if (blogs.length === 0) {
        elements.blogsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">¯\\_(ツ)_/¯</div>
                <p>${texts.no_results}</p>
            </div>
        `;
    } else {
        elements.blogsContainer.innerHTML = blogs.map((blog, index) => `
            <div class="list-item ${index === state.blogs.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <div class="item-name">${blog.title}</div>
                <div class="item-description">${blog.description}</div>
                <div class="item-tags">
                    ${blog.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    <span class="item-tag" style="color: var(--fg-dim);">${Math.ceil(blog.content.length / 1000)} ${texts.read_time}</span>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        elements.blogsContainer.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', () => {
                state.blogs.selectedIndex = parseInt(item.dataset.index);
                openBlogDetail();
            });
        });
    }
}

function openProjectDetail() {
    const projects = getFilteredProjects();
    const project = projects[state.projects.selectedIndex];
    
    if (!project) return;
    
    elements.projectsDetailContainer.innerHTML = `
        <button class="back-button" onclick="closeProjectDetail()">${texts.go_back}</button>
        <div class="detail-header">
            <h2 class="detail-title">${project.name}</h2>
            <div class="detail-tags">
                ${project.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
            </div>
        </div>
        <div class="detail-section">
            <h3>${texts.details_description}</h3>
            <p>${project.details.whatItIs}</p>
        </div>
        <div class="detail-section">
            <h3>${texts.details_learnings}</h3>
            <ul>
                ${project.details.whatILearned.map(learning => `<li>${learning}</li>`).join('')}
            </ul>
        </div>
        <div class="detail-section">
            <h3>${texts.details_improvements}</h3>
            <ul>
                ${project.details.whatCanBeImproved.map(improvement => `<li>${improvement}</li>`).join('')}
            </ul>
        </div>
    `;
    
    state.projects.detailOpen = true;
    elements.projectsList.classList.add('hidden');
    elements.projectsDetail.classList.add('active');
    
    // Scroll to top
    elements.projectsDetailContainer.scrollTop = 0;
}

function closeProjectDetail() {
    state.projects.detailOpen = false;
    elements.projectsDetail.classList.remove('active');
    elements.projectsList.classList.remove('hidden');
    
    // Ensure valid selection after filtering
    clampSelectedIndex('projects');
    
    // Re-render with filtered projects and restore scroll position
    setTimeout(() => {
        renderProjects(getFilteredProjects());
        const selectedItem = elements.projectsContainer.querySelector('.list-item.selected');
        if (selectedItem) {
            selectedItem.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }
    }, 50);
}

function openBlogDetail() {
    const blogs = getFilteredBlogs();
    const blog = blogs[state.blogs.selectedIndex];
    
    if (!blog) return;
    
    // Format content with markdown
    const formattedContent = markdownToHtml(blog.content);
    
    elements.blogsDetailContainer.innerHTML = `
        <button class="back-button" onclick="closeBlogDetail()">${texts.go_back}</button>
        <div class="detail-header">
            <h2 class="detail-title">${blog.title}</h2>
            <div class="detail-tags">
                ${blog.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
                <span class="detail-tag" style="color: var(--fg-dim);">${Math.ceil(blog.content.length / 1000)} ${texts.read_time}</span>
            </div>
        </div>
        <div class="detail-section">
            ${formattedContent}
        </div>
    `;
    
    state.blogs.detailOpen = true;
    elements.blogsList.classList.add('hidden');
    elements.blogsDetail.classList.add('active');
    
    // Scroll to top
    elements.blogsDetailContainer.scrollTop = 0;
}

function closeBlogDetail() {
    state.blogs.detailOpen = false;
    elements.blogsDetail.classList.remove('active');
    elements.blogsList.classList.remove('hidden');
    
    // Ensure valid selection after filtering
    clampSelectedIndex('blogs');
    
    // Re-render with filtered blogs and restore scroll position
    setTimeout(() => {
        renderBlogs(getFilteredBlogs());
        const selectedItem = elements.blogsContainer.querySelector('.list-item.selected');
        if (selectedItem) {
            selectedItem.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }
    }, 50);
}

function getFilteredBlogs() {
    if (!state.blogs.searchQuery) return state.blogs.items;
    
    const query = state.blogs.searchQuery.toLowerCase();
    return state.blogs.items.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.description.toLowerCase().includes(query) ||
        blog.tags.some(tag => tag.toLowerCase().includes(query))
    );
}

// Navigation Functions
function switchTab(direction) {
    const currentIndex = tabs.indexOf(state.currentTab);
    let newIndex;
    
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % tabs.length;
    } else {
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    
    const newTab = tabs[newIndex];
    
    // Save scroll position before switching
    if (state.currentTab === 'projects' && !state.projects.detailOpen) {
        state.projects.scrollPosition = elements.projectsContainer.scrollTop;
    } else if (state.currentTab === 'blogs' && !state.blogs.detailOpen) {
        state.blogs.scrollPosition = elements.blogsContainer.scrollTop;
    }
    
    // Update UI
    state.currentTab = newTab;
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === newTab);
    });
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === newTab);
    });
    
    // Restore scroll position
    setTimeout(() => {
        if (newTab === 'projects' && !state.projects.detailOpen) {
            elements.projectsContainer.scrollTop = state.projects.scrollPosition;
        } else if (newTab === 'blogs' && !state.blogs.detailOpen) {
            elements.blogsContainer.scrollTop = state.blogs.scrollPosition;
        }
    }, 50);
}

function navigateList(direction) {
    if (state.currentTab === 'projects' && !state.projects.detailOpen) {
        const projects = getFilteredProjects();
        const oldIndex = state.projects.selectedIndex;
        if (direction === 'down') {
            state.projects.selectedIndex = Math.min(state.projects.selectedIndex + 1, projects.length - 1);
        } else {
            state.projects.selectedIndex = Math.max(state.projects.selectedIndex - 1, 0);
        }
        
        if (oldIndex !== state.projects.selectedIndex) {
            renderProjects(projects);
            const selectedItem = elements.projectsContainer.querySelector('.list-item.selected');
            if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } else if (state.currentTab === 'blogs' && !state.blogs.detailOpen) {
        const blogs = getFilteredBlogs();
        const oldIndex = state.blogs.selectedIndex;
        
        if (direction === 'down') {
            state.blogs.selectedIndex = Math.min(state.blogs.selectedIndex + 1, blogs.length - 1);
        } else {
            state.blogs.selectedIndex = Math.max(state.blogs.selectedIndex - 1, 0);
        }
        
        if (oldIndex !== state.blogs.selectedIndex) {
            renderBlogs(blogs);
            const selectedItem = elements.blogsContainer.querySelector('.list-item.selected');
            if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

function scrollDetail(direction) {
    const scrollAmount = 50;
    let container = null;
    
    if (state.currentTab === 'projects' && state.projects.detailOpen) {
        container = elements.projectsDetailContainer;
    } else if (state.currentTab === 'blogs' && state.blogs.detailOpen) {
        container = elements.blogsDetailContainer;
    }
    
    if (container) {
        if (direction === 'down') {
            container.scrollTop += scrollAmount;
        } else {
            container.scrollTop -= scrollAmount;
        }
    }
}

function openSelected() {
    if (state.currentTab === 'projects' && !state.projects.detailOpen) {
        openProjectDetail();
    } else if (state.currentTab === 'blogs' && !state.blogs.detailOpen) {
        openBlogDetail();
    }
}

function goBack() {
    if (state.currentTab === 'projects' && state.projects.detailOpen) {
        closeProjectDetail();
    } else if (state.currentTab === 'blogs' && state.blogs.detailOpen) {
        closeBlogDetail();
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    // Don't capture keys when typing in search inputs
    if (document.activeElement === elements.blogSearch || document.activeElement === elements.projectSearch) {
        if (e.key === 'Escape') {
            if (document.activeElement === elements.blogSearch) {
                elements.blogSearch.blur();
            } else {
                elements.projectSearch.blur();
            }
            e.preventDefault();
        }
        return;
    }
    
    // Handle j/k for scrolling in detail views
    const inDetailView = (state.currentTab === 'projects' && state.projects.detailOpen) || 
                         (state.currentTab === 'blogs' && state.blogs.detailOpen);
    
    switch (e.key) {
        case 'h':
        case 'H':
            e.preventDefault();
            switchTab('prev');
            break;
        case 'l':
        case 'L':
            e.preventDefault();
            switchTab('next');
            break;
        case 'j':
        case 'J':
            e.preventDefault();
            if (inDetailView) {
                scrollDetail('down');
            } else {
                navigateList('down');
            }
            break;
        case 'k':
        case 'K':
            e.preventDefault();
            if (inDetailView) {
                scrollDetail('up');
            } else {
                navigateList('up');
            }
            break;
        case 'Enter':
            e.preventDefault();
            openSelected();
            break;
        case 'Escape':
        case 'q':
        case 'Q':
            e.preventDefault();
            goBack();
            break;
        case '/':
            if (state.currentTab === 'blogs' && !state.blogs.detailOpen) {
                e.preventDefault();
                elements.blogSearch.focus();
            } else if (state.currentTab === 'projects' && !state.projects.detailOpen) {
                e.preventDefault();
                elements.projectSearch.focus();
            }
            break;
    }
});

elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab !== state.currentTab) {
            // Determine direction
            const currentIndex = tabs.indexOf(state.currentTab);
            const newIndex = tabs.indexOf(tab);
            if (newIndex > currentIndex) {
                switchTab('next');
            } else {
                switchTab('prev');
            }
        }
    });
});

elements.projectSearch.addEventListener('input', (e) => {
    state.projects.searchQuery = e.target.value;
    state.projects.selectedIndex = 0;
    state.projects.scrollPosition = 0;
    renderProjects(getFilteredProjects());
});

// Ensure selected index stays valid when filtering
function clampSelectedIndex(type) {
    if (type === 'projects') {
        const filtered = getFilteredProjects();
        if (state.projects.selectedIndex >= filtered.length) {
            state.projects.selectedIndex = Math.max(0, filtered.length - 1);
        }
    } else if (type === 'blogs') {
        const filtered = getFilteredBlogs();
        if (state.blogs.selectedIndex >= filtered.length) {
            state.blogs.selectedIndex = Math.max(0, filtered.length - 1);
        }
    }
}

elements.blogSearch.addEventListener('input', (e) => {
    state.blogs.searchQuery = e.target.value;
    state.blogs.selectedIndex = 0;
    state.blogs.scrollPosition = 0;
    renderBlogs(getFilteredBlogs());
});


// Initialize
console.log('Portfolio script loaded');
loadContentIndex();
