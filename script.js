class JapaneseLadder {
    constructor() {
        this.rungs = new Set(); // Store active rungs as "rail,y" strings
        this.isAnimating = false;
        this.currentNumberCount = 3;
        
        this.initializeEventListeners();
        this.buildLadder();
        this.updateStatus("Click the circles to add rungs, then press Start!");
    }
    
    showRunAgainButton() {
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('runAgainButton').style.display = 'inline-block';
    }
    
    hideRunAgainButton() {
        document.getElementById('startButton').style.display = 'inline-block';
        document.getElementById('runAgainButton').style.display = 'none';
    }
    
    async runAgain() {
        // Clear previous animation
        document.getElementById('animatedNumbers').innerHTML = '';
        
        // Run the animation again with the same settings
        await this.startAnimation();
    }
    
    initializeEventListeners() {
        // Number count change listener
        document.getElementById('numberCount').addEventListener('change', (e) => {
            if (!this.isAnimating) {
                this.currentNumberCount = parseInt(e.target.value);
                this.buildLadder();
                this.hideRunAgainButton();
                // Clear animated numbers from any previous animation
                document.getElementById('animatedNumbers').innerHTML = '';
                // Reset button state
                document.getElementById('startButton').disabled = false;
                // Update status for the new configuration
                this.updateStatus("Click the circles to add rungs, then press Start!");
            }
        });
        
        // Control button listeners
        document.getElementById('startButton').addEventListener('click', () => this.startAnimation());
        document.getElementById('runAgainButton').addEventListener('click', () => this.runAgain());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());
    }
    
    buildLadder() {
        // Clear existing content
        this.rungs.clear();
        
        // Clear visual rungs and reset toggle states
        document.getElementById('rungs').innerHTML = '';
        document.querySelectorAll('.rung-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        
        // Calculate dimensions
        const railSpacing = 80;
        const totalWidth = (this.currentNumberCount - 1) * railSpacing;
        const startX = (400 - totalWidth) / 2; // Center the ladder
        
        this.railPositions = [];
        for (let i = 0; i < this.currentNumberCount; i++) {
            this.railPositions.push(startX + i * railSpacing);
        }
        
        // Update SVG content
        this.buildNumberCircles();
        this.buildRails();
        this.buildRungToggles();
        
        this.updateStatus("Click the circles to add rungs, then press Start!");
    }
    
    buildNumberCircles() {
        const container = document.getElementById('numberCircles');
        container.innerHTML = '';
        
        for (let i = 0; i < this.currentNumberCount; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', this.railPositions[i]);
            circle.setAttribute('cy', 50);
            circle.setAttribute('r', 20);
            circle.setAttribute('class', 'number-circle');
            circle.setAttribute('id', `number${i + 1}`);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.railPositions[i]);
            text.setAttribute('y', 55);
            text.setAttribute('class', 'number-text');
            text.textContent = i + 1;
            
            container.appendChild(circle);
            container.appendChild(text);
        }
    }
    
    buildRails() {
        const container = document.getElementById('ladderSvg');
        
        // Remove existing rails
        container.querySelectorAll('.rail').forEach(rail => rail.remove());
        
        // Add new rails
        for (let i = 0; i < this.currentNumberCount; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.railPositions[i]);
            line.setAttribute('y1', 80);
            line.setAttribute('x2', this.railPositions[i]);
            line.setAttribute('y2', 550);
            line.setAttribute('class', 'rail');
            
            // Insert before rungToggles group
            const rungToggles = document.getElementById('rungToggles');
            container.insertBefore(line, rungToggles);
        }
    }
    
    buildRungToggles() {
        const container = document.getElementById('rungToggles');
        container.innerHTML = '';
        
        // Add rung toggle points between each pair of adjacent rails
        for (let rail = 0; rail < this.currentNumberCount - 1; rail++) {
            const x = (this.railPositions[rail] + this.railPositions[rail + 1]) / 2;
            
            // Add toggle points at regular intervals
            for (let y = 120; y <= 480; y += 60) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 8);
                circle.setAttribute('class', 'rung-toggle');
                circle.setAttribute('data-position', `${rail},${y}`);
                circle.addEventListener('click', (e) => this.toggleRung(e));
                
                container.appendChild(circle);
            }
        }
    }
    
    toggleRung(event) {
        if (this.isAnimating) return;
        
        const toggle = event.target;
        const position = toggle.getAttribute('data-position');
        const [rail, y] = position.split(',').map(Number);
        const rungKey = `${rail},${y}`;
        
        if (this.rungs.has(rungKey)) {
            // Remove rung
            this.rungs.delete(rungKey);
            toggle.classList.remove('active');
            this.removeRungLine(rail, y);
        } else {
            // Check if there's already a rung at this level (y position)
            const existingRungAtLevel = Array.from(this.rungs).find(key => {
                const [, existingY] = key.split(',').map(Number);
                return existingY === y;
            });
            
            if (existingRungAtLevel) {
                // Remove the existing rung at this level first
                const [existingRail, existingY] = existingRungAtLevel.split(',').map(Number);
                this.rungs.delete(existingRungAtLevel);
                
                // Find and deactivate the existing toggle
                const existingToggle = document.querySelector(`[data-position="${existingRail},${existingY}"]`);
                if (existingToggle) {
                    existingToggle.classList.remove('active');
                }
                
                // Remove the existing rung line
                this.removeRungLine(existingRail, existingY);
            }
            
            // Add the new rung
            this.rungs.add(rungKey);
            toggle.classList.add('active');
            this.addRungLine(rail, y);
        }
        
        // Hide run again button since ladder configuration changed
        this.hideRunAgainButton();
        this.updateRungCount();
    }
    
    addRungLine(rail, y) {
        const rungs = document.getElementById('rungs');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        const x1 = this.railPositions[rail];
        const x2 = this.railPositions[rail + 1];
        
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y);
        line.setAttribute('class', 'rung fade-in');
        line.setAttribute('data-position', `${rail},${y}`);
        
        rungs.appendChild(line);
    }
    
    removeRungLine(rail, y) {
        const rungLine = document.querySelector(`#rungs line[data-position="${rail},${y}"]`);
        if (rungLine) {
            rungLine.classList.add('fade-out');
            setTimeout(() => {
                if (rungLine.parentNode) {
                    rungLine.parentNode.removeChild(rungLine);
                }
            }, 300);
        }
    }
    
    updateRungCount() {
        const count = this.rungs.size;
        if (count === 0) {
            this.updateStatus("Click the circles to add rungs, then press Start!");
        } else {
            this.updateStatus(`${count} rung${count !== 1 ? 's' : ''} added. Ready to start!`);
        }
    }
    
    async startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        document.getElementById('startButton').disabled = true;
        
        // Get selected animation mode
        const animationMode = document.querySelector('input[name="animationMode"]:checked').value;
        this.updateStatus(`Animation in progress (${animationMode})...`);
        
        // Create animated number elements
        const animatedContainer = document.getElementById('animatedNumbers');
        animatedContainer.innerHTML = '';
        
        const animatedNumbers = [];
        for (let i = 0; i < this.currentNumberCount; i++) {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', this.railPositions[i]);
            circle.setAttribute('cy', 50);
            circle.setAttribute('r', 18);
            circle.setAttribute('class', 'animated-number');
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.railPositions[i]);
            text.setAttribute('y', 55);
            text.setAttribute('class', 'animated-number-text');
            text.textContent = i + 1;
            
            group.appendChild(circle);
            group.appendChild(text);
            animatedContainer.appendChild(group);
            
            animatedNumbers.push({
                circle: circle,
                text: text,
                currentRail: i,
                currentY: 50
            });
        }
        
        if (animationMode === 'simultaneous') {
            // Animate all numbers simultaneously
            await Promise.all(animatedNumbers.map(numberObj => this.animateNumber(numberObj)));
        } else {
            // Animate each number one by one (sequential)
            for (let numberIndex = 0; numberIndex < this.currentNumberCount; numberIndex++) {
                await this.animateNumber(animatedNumbers[numberIndex]);
                await this.delay(500); // Pause between numbers
            }
        }
        
        // Show final positions
        this.showFinalResult(animatedNumbers);
        
        this.isAnimating = false;
        document.getElementById('startButton').disabled = false;
        this.showRunAgainButton();
        this.updateStatus("Animation complete! Click Run Again to replay or Reset to change rungs.");
    }
    
    async animateNumber(numberObj) {
        let currentRail = numberObj.currentRail;
        let currentY = 80; // Start below the top circles
        
        // Get all rungs and sort by Y position
        const allRungs = Array.from(this.rungs)
            .map(rungKey => {
                const [rail, y] = rungKey.split(',').map(Number);
                return { rail, y };
            })
            .sort((a, b) => a.y - b.y);
        
        // Find rungs that this number will actually encounter
        let currentPosition = currentRail;
        const encounterPoints = [];
        
        for (const rung of allRungs) {
            // Check if this rung affects the current path
            if (rung.rail === currentPosition) {
                // This rung will move us to the right
                encounterPoints.push({ y: rung.y, fromRail: currentPosition, toRail: currentPosition + 1 });
                currentPosition++;
            } else if (rung.rail === currentPosition - 1) {
                // This rung will move us to the left
                encounterPoints.push({ y: rung.y, fromRail: currentPosition, toRail: currentPosition - 1 });
                currentPosition--;
            }
            // If the rung doesn't affect our current position, we ignore it
        }
        
        // Animate through each encounter point
        for (const encounter of encounterPoints) {
            // Move down to the rung level
            await this.moveNumberTo(numberObj, this.railPositions[encounter.fromRail], encounter.y);
            
            // Cross the rung
            await this.moveNumberTo(numberObj, this.railPositions[encounter.toRail], encounter.y);
        }
        
        // Move to final position at bottom
        await this.moveNumberTo(numberObj, this.railPositions[currentPosition], 550);
        
        return currentPosition;
    }
    
    async moveNumberTo(numberObj, targetX, targetY) {
        return new Promise(resolve => {
            const startX = parseFloat(numberObj.circle.getAttribute('cx'));
            const startY = parseFloat(numberObj.circle.getAttribute('cy'));
            const duration = 800;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation
                const easeInOut = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                const currentX = startX + (targetX - startX) * easeInOut;
                const currentY = startY + (targetY - startY) * easeInOut;
                
                numberObj.circle.setAttribute('cx', currentX);
                numberObj.circle.setAttribute('cy', currentY);
                numberObj.text.setAttribute('x', currentX);
                numberObj.text.setAttribute('y', currentY + 5);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    showFinalResult(animatedNumbers) {
        const finalPositions = animatedNumbers.map((num, index) => {
            const finalX = parseFloat(num.circle.getAttribute('cx'));
            // Find which rail this X position corresponds to
            let finalRail = 0;
            let minDistance = Math.abs(finalX - this.railPositions[0]);
            
            for (let i = 1; i < this.railPositions.length; i++) {
                const distance = Math.abs(finalX - this.railPositions[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    finalRail = i;
                }
            }
            
            return { original: index + 1, final: finalRail };
        });
        
        const permutation = finalPositions
            .sort((a, b) => a.final - b.final)
            .map(pos => pos.original);
        
        this.updateStatus(`Final permutation: [${permutation.join(', ')}]`);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    clearRungs() {
        if (this.isAnimating) return;
        
        // Remove all active rungs
        document.querySelectorAll('.rung-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        
        document.getElementById('rungs').innerHTML = '';
        this.rungs.clear();
        this.updateStatus("All rungs cleared. Add some rungs and press Start!");
    }
    
    reset() {
        if (this.isAnimating) return;
        
        // Clear animated numbers
        document.getElementById('animatedNumbers').innerHTML = '';
        
        // Clear all rungs
        this.clearRungs();
        
        // Reset button state and hide run again button
        document.getElementById('startButton').disabled = false;
        this.hideRunAgainButton();
        
        // Update status
        this.updateStatus("Click the circles to add rungs, then press Start!");
    }
    
    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JapaneseLadder();
});
