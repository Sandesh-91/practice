
document.addEventListener('DOMContentLoaded', function() {
 
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        }
        
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-buttons {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1rem;
        }
        
        .book-detail {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .book-detail-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-top: 2rem;
        }
        
        .book-images img {
            width: 100%;
            border-radius: 10px;
            margin-bottom: 1rem;
        }
        
        .book-meta {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            flex-wrap: wrap;
        }
        
        .book-meta span {
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.9rem;
        }
        
        .condition { background: #e0e7ff; color: #4f46e5; }
        .type { background: #d1fae5; color: #065f46; }
        .status { background: #fef3c7; color: #92400e; }
        
        .owner-details {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .action-buttons {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
        }
        
        .rental-request-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .request-actions {
            margin-top: 1rem;
            display: flex;
            gap: 1rem;
        }
        
        .status-pending { color: #f59e0b; }
        .status-accepted { color: #10b981; }
        .status-rejected { color: #ef4444; }
        .status-completed { color: #6b7280; }
        
        .no-books, .no-requests {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 2rem;
        }
        
        @media (max-width: 768px) {
            .book-detail-content {
                grid-template-columns: 1fr;
            }
            
            .search-controls {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
});

// Error boundary
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showToast('An unexpected error occurred', 'error');
});