// API base URL
const API_BASE = '/api';

// Current review data
let currentReview = null;
let currentSuggestionId = null;

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Load content for specific tabs
        if (tabName === 'history') {
            loadReviews();
        } else if (tabName === 'stats') {
            loadStats();
        }
    });
});

// Source type switching
document.getElementById('review-source').addEventListener('change', (e) => {
    const source = e.target.value;
    document.getElementById('github-input').style.display = source === 'github' ? 'block' : 'none';
    document.getElementById('diff-input').style.display = source === 'diff' ? 'block' : 'none';
});

// Start review
document.getElementById('start-review-btn').addEventListener('click', async () => {
    const source = document.getElementById('review-source').value;
    const url = document.getElementById('github-url').value;
    const content = document.getElementById('diff-content').value;
    
    if (source === 'github' && !url) {
        alert('Please enter a GitHub PR URL');
        return;
    }
    
    if (source === 'diff' && !content) {
        alert('Please paste diff content');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('review-results').style.display = 'none';
    document.getElementById('start-review-btn').disabled = true;
    
    try {
        const requestBody = {
            source: source,
            url: source === 'github' ? url : null,
            content: source === 'diff' ? content : null
        };
        
        const response = await fetch(`${API_BASE}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        currentReview = data;
        displayReview(data);
        
    } catch (error) {
        alert(`Error starting review: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('start-review-btn').disabled = false;
    }
});

// Display review results
function displayReview(review) {
    const resultsDiv = document.getElementById('review-results');
    const summaryDiv = document.getElementById('review-summary');
    const suggestionsDiv = document.getElementById('suggestions-list');
    
    // Summary
    summaryDiv.innerHTML = `
        <h3>Review Summary</h3>
        <p><strong>Review ID:</strong> ${review.review_id}</p>
        <p><strong>Files Changed:</strong> ${review.file_count}</p>
        <p><strong>Total Changes:</strong> ${review.total_changes} lines</p>
        <p><strong>Suggestions:</strong> ${review.suggestions.length}</p>
        <p><strong>Created:</strong> ${new Date(review.created_at).toLocaleString()}</p>
    `;
    
    // Suggestions
    suggestionsDiv.innerHTML = '';
    if (review.suggestions.length === 0) {
        suggestionsDiv.innerHTML = '<p>No suggestions generated. Code looks good! 🎉</p>';
    } else {
        review.suggestions.forEach(suggestion => {
            const card = createSuggestionCard(suggestion, review.review_id);
            suggestionsDiv.appendChild(card);
        });
    }
    
    resultsDiv.style.display = 'block';
}

// Create suggestion card
function createSuggestionCard(suggestion, reviewId) {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.dataset.suggestionId = suggestion.id;
    card.dataset.reviewId = reviewId;
    
    const categoryClass = suggestion.category.replace('_', '-');
    
    card.innerHTML = `
        <div class="suggestion-header">
            <div class="suggestion-meta">
                <span class="category-badge ${categoryClass}">${suggestion.category}</span>
                <span class="confidence-score">Confidence: ${suggestion.confidence}%</span>
                <span>Line ${suggestion.line_number}${suggestion.end_line_number ? `-${suggestion.end_line_number}` : ''}</span>
                <span>${suggestion.file_path}</span>
            </div>
        </div>
        <div class="suggestion-text">${escapeHtml(suggestion.suggestion)}</div>
        ${suggestion.code_snippet ? `<div class="code-snippet">${escapeHtml(suggestion.code_snippet)}</div>` : ''}
        <div class="suggestion-actions">
            <button class="btn-accept" onclick="openFeedbackModal('${reviewId}', '${suggestion.id}', 'accept')">Accept</button>
            <button class="btn-reject" onclick="openFeedbackModal('${reviewId}', '${suggestion.id}', 'reject')">Reject</button>
            <button class="btn-edit" onclick="openFeedbackModal('${reviewId}', '${suggestion.id}', 'edit')">Edit</button>
        </div>
    `;
    
    return card;
}

// Open feedback modal
function openFeedbackModal(reviewId, suggestionId, action) {
    currentReview = reviewId;
    currentSuggestionId = suggestionId;
    
    const modal = document.getElementById('feedback-modal');
    const rejectReason = document.getElementById('reject-reason');
    const editSuggestion = document.getElementById('edit-suggestion');
    const reasonText = document.getElementById('reason-text');
    const editedText = document.getElementById('edited-text');
    const submitBtn = document.getElementById('submit-feedback-btn');
    
    // Reset form
    reasonText.value = '';
    editedText.value = '';
    rejectReason.style.display = 'none';
    editSuggestion.style.display = 'none';
    
    // Show relevant fields based on action
    if (action === 'reject') {
        rejectReason.style.display = 'block';
    } else if (action === 'edit') {
        editSuggestion.style.display = 'block';
        // Pre-fill with current suggestion text
        const suggestionCard = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
        if (suggestionCard) {
            const suggestionTextEl = suggestionCard.querySelector('.suggestion-text');
            if (suggestionTextEl) {
                editedText.value = suggestionTextEl.textContent.trim();
            }
        }
    }
    
    // Store action for submit
    submitBtn.setAttribute('data-action', action);
    
    // Update submit button handler
    submitBtn.onclick = function() {
        submitFeedback(reviewId, suggestionId, action);
    };
    
    modal.style.display = 'block';
}

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('feedback-modal').style.display = 'none';
});

window.onclick = (event) => {
    const modal = document.getElementById('feedback-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Submit feedback
async function submitFeedback(reviewId, suggestionId, action) {
    const reasonText = document.getElementById('reason-text');
    const editedText = document.getElementById('edited-text');
    
    const reason = reasonText ? reasonText.value.trim() : '';
    const edited = editedText ? editedText.value.trim() : '';
    
    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                review_id: reviewId,
                suggestion_id: suggestionId,
                action: action,
                reason: reason || null,
                edited_suggestion: edited || null
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        alert(data.message || 'Feedback submitted successfully!');
        
        // Update UI
        const suggestionCard = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
        if (suggestionCard) {
            suggestionCard.classList.add(action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'edited');
            const actionsEl = suggestionCard.querySelector('.suggestion-actions');
            if (actionsEl) {
                const statusText = action === 'accept' ? '✓ Accepted' : action === 'reject' ? '✗ Rejected' : '✏ Edited';
                const statusColor = action === 'accept' ? '#27ae60' : action === 'reject' ? '#e74c3c' : '#3498db';
                actionsEl.innerHTML = `<span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>`;
            }
        }
        
        // Close modal
        document.getElementById('feedback-modal').style.display = 'none';
        
    } catch (error) {
        alert(`Error submitting feedback: ${error.message}`);
        console.error('Feedback submission error:', error);
    }
}

// Load reviews history
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/reviews?limit=20`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        const reviews = await response.json();
        const reviewsList = document.getElementById('reviews-list');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews yet. Start a new review to see history.</p>';
            return;
        }
        
        reviewsList.innerHTML = '';
        reviews.forEach(review => {
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `
                <h3>Review ${review.review_id.substring(0, 8)}</h3>
                <p><strong>Created:</strong> ${new Date(review.created_at).toLocaleString()}</p>
                <p><strong>Suggestions:</strong> ${review.suggestion_count}</p>
                <p><strong>Files:</strong> ${review.files.length}</p>
            `;
            item.onclick = () => {
                // Switch to review tab and load this review
                document.querySelector('[data-tab="review"]').click();
                loadReviewDetails(review.review_id);
            };
            reviewsList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviews-list').innerHTML = `<p>Error loading reviews: ${error.message}</p>`;
    }
}

// Load review details
async function loadReviewDetails(reviewId) {
    try {
        const response = await fetch(`${API_BASE}/review/${reviewId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        const review = await response.json();
        // Convert to format expected by displayReview
        const formattedReview = {
            review_id: review.review_id,
            file_count: review.files.length,
            total_changes: 0, // Not available in this response
            suggestions: [],
            created_at: review.created_at
        };
        
        // Flatten suggestions from files
        review.files.forEach(file => {
            file.suggestions.forEach(suggestion => {
                formattedReview.suggestions.push({
                    ...suggestion,
                    file_path: file.file_path
                });
            });
        });
        
        displayReview(formattedReview);
        
    } catch (error) {
        alert(`Error loading review: ${error.message}`);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        const stats = await response.json();
        const statsContent = document.getElementById('stats-content');
        
        statsContent.innerHTML = `
            <div class="stat-card">
                <h3>Total Feedback</h3>
                <div class="stat-value">${stats.total_feedback || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Acceptance Rate</h3>
                <div class="stat-value">${stats.acceptance_rate || 0}%</div>
            </div>
            <div class="stat-card">
                <h3>Accepted</h3>
                <div class="stat-value">${stats.accepts || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Rejected</h3>
                <div class="stat-value">${stats.rejects || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Edited</h3>
                <div class="stat-value">${stats.edits || 0}</div>
            </div>
            <div class="stat-card">
                <h3>By Category</h3>
                <pre>${JSON.stringify(stats.by_category || {}, null, 2)}</pre>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('stats-content').innerHTML = `<p>Error loading statistics: ${error.message}</p>`;
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make openFeedbackModal available globally
window.openFeedbackModal = openFeedbackModal;

