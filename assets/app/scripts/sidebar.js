document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const resizer = document.getElementById('sidebar-resizer');
    const body = document.body;
    const minWidth = 200; // Minimum sidebar width
    const maxWidth = 800; // Maximum sidebar width

    let isResizing = false;
    let currentSidebarWidth = 400; // Initial width

    if (hamburgerBtn && sidebar && mainContent && resizer) {
        // Function to apply width changes WITHOUT transition
        const applyWidthImmediate = (width) => {
            const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth));
            sidebar.style.transition = 'none'; // Disable transition during drag
            sidebar.style.width = `${clampedWidth}px`;
            if (body.classList.contains('sidebar-open')) {
                sidebar.style.left = '0px';
            } else {
                 sidebar.style.left = `-${clampedWidth}px`;
            }
            currentSidebarWidth = clampedWidth;
        };

        // Function to set initial/final state WITH transition
        const applyWidthWithTransition = (width) => {
             const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth));
             // Ensure transitions are enabled
             sidebar.style.transition = 'width 0.3s ease, left 0.3s ease';
             sidebar.style.width = `${clampedWidth}px`;
             if (body.classList.contains('sidebar-open')) {
                 sidebar.style.left = '0px';
             } else {
                  sidebar.style.left = `-${clampedWidth}px`;
             }
             currentSidebarWidth = clampedWidth;
        };


        // Set initial state based on currentSidebarWidth
        applyWidthWithTransition(currentSidebarWidth); // Use function with transition for init

        // Toggle sidebar on hamburger button click
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('sidebar-open');
            // Apply width with transition handles the logic now
            applyWidthWithTransition(currentSidebarWidth);
        });

        // Close sidebar if clicking on the main content area
        mainContent.addEventListener('click', () => {
            if (body.classList.contains('sidebar-open') && !isResizing) {
                body.classList.remove('sidebar-open');
                // Apply width with transition handles the logic now
                applyWidthWithTransition(currentSidebarWidth);
            }
        });

        // Resizer logic
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            body.classList.add('no-select'); // Prevent text selection
            // Transitions are disabled within applyWidthImmediate
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            let newWidth = e.clientX;
            applyWidthImmediate(newWidth); // Use immediate application during drag
        };

        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                body.classList.remove('no-select'); // Re-enable text selection
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                // Re-enable transitions by calling the appropriate function
                applyWidthWithTransition(currentSidebarWidth);
            }
        };

    } else {
        console.error('Sidebar or resizer elements not found');
    }
});
