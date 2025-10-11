import type { MapPoint, ShoppingListItem } from './types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from './data';

// A* pathfinding algorithm
class Node {
    constructor(
        public parent: Node | null,
        public pos: MapPoint,
        public g = 0, // cost from start
        public h = 0, // heuristic cost to end
        public f = 0  // total cost (g + h)
    ) {}

    equals(other: Node) {
        return this.pos.x === other.pos.x && this.pos.y === other.pos.y;
    }
}

// Manhattan distance heuristic
function heuristic(a: MapPoint, b: MapPoint) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(start: MapPoint, end: MapPoint, grid: number[][]): MapPoint[] | null {
    const startNode = new Node(null, {x: Math.floor(start.x), y: Math.floor(start.y)});
    const endNode = new Node(null, {x: Math.floor(end.x), y: Math.floor(end.y)});

    const openList: Node[] = [];
    const closedList: Node[] = [];
    openList.push(startNode);

    const maxX = grid[0].length - 1;
    const maxY = grid.length - 1;

    while (openList.length > 0) {
        let currentNode = openList[0];
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < currentNode.f) {
                currentNode = openList[i];
                currentIndex = i;
            }
        }

        openList.splice(currentIndex, 1);
        closedList.push(currentNode);

        if (currentNode.equals(endNode)) {
            const path: MapPoint[] = [];
            let current: Node | null = currentNode;
            while (current) {
                path.push(current.pos);
                current = current.parent;
            }
            return path.reverse();
        }

        const children: Node[] = [];
        const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

        for (const move of moves) {
            const nodePos = { x: currentNode.pos.x + move.x, y: currentNode.pos.y + move.y };
            
            if (nodePos.x > maxX || nodePos.x < 0 || nodePos.y > maxY || nodePos.y < 0) {
                continue;
            }

            // Treat shelves (1) as obstacles
            if (grid[nodePos.y][nodePos.x] === 1) {
                continue;
            }

            const newNode = new Node(currentNode, nodePos);
            children.push(newNode);
        }

        for (const child of children) {
            if (closedList.some(closedChild => closedChild.equals(child))) {
                continue;
            }

            child.g = currentNode.g + 1;
            child.h = heuristic(child.pos, endNode.pos);
            child.f = child.g + child.h;

            if (openList.some(openNode => child.equals(openNode) && child.g >= openNode.g)) {
                continue;
            }

            openList.push(child);
        }
    }

    return null; // No path found
}


export type InstructionType = 'start' | 'straight' | 'left' | 'right' | 'turn-left' | 'turn-right' | 'scan' | 'finish';
export interface Instruction {
    type: InstructionType;
    text: string;
    distance?: number;
    itemId?: string;
}

const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;


export function getTurnByTurnInstructions(items: ShoppingListItem[]): Instruction[] {
    if (items.length === 0) return [];

    const waypoints: MapPoint[] = [
        ENTRANCE_POS,
        ...items.map(item => ({
            x: getAisleNavX(item.location.aisle),
            y: item.location.section,
        })),
        CHECKOUT_POS,
    ];

    const pathSegments: {path: MapPoint[], itemId: string}[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = findPath(waypoints[i], waypoints[i+1], STORE_LAYOUT);
        if (segment) {
            pathSegments.push({
                path: i === 0 ? segment : segment.slice(1),
                itemId: items[i]?.id || 'checkout',
            });
        }
    }
    

    // --- Convert path segments to instructions ---
    const instructions: Instruction[] = [];
    if (pathSegments.length === 0) return [];

    instructions.push({ type: 'start', text: 'Start at the entrance. Follow the path.' });
    
    for (const seg of pathSegments) {
        const path = seg.path;
        if (!path || path.length < 2) continue;

        let currentDirection: 'N'|'S'|'E'|'W' | null = null;
        let straightCount = 0;

        for (let i = 1; i < path.length; i++) {
            const p1 = path[i-1];
            const p2 = path[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            let direction: 'N'|'S'|'E'|'W';
            if (dy < 0) direction = 'N';
            else if (dy > 0) direction = 'S';
            else if (dx > 0) direction = 'E';
            else direction = 'W';

            if (direction === currentDirection) {
                straightCount++;
            } else {
                // Add previous straight instruction if any
                if (straightCount > 0) {
                     instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount});
                }
                
                // Determine turn
                if (currentDirection) {
                    if (currentDirection === 'N' && direction === 'W') instructions.push({ type: 'left', text: 'Turn left.' });
                    else if (currentDirection === 'N' && direction === 'E') instructions.push({ type: 'right', text: 'Turn right.' });
                    else if (currentDirection === 'S' && direction === 'W') instructions.push({ type: 'right', text: 'Turn right.' });
                    else if (currentDirection === 'S' && direction === 'E') instructions.push({ type: 'left', text: 'Turn left.' });
                    else if (currentDirection === 'W' && direction === 'S') instructions.push({ type: 'left', text: 'Turn left.' });
                    else if (currentDirection === 'W' && direction === 'N') instructions.push({ type: 'right', text: 'Turn right.' });
                    else if (currentDirection === 'E' && direction === 'S') instructions.push({ type: 'right', text: 'Turn right.' });
                    else if (currentDirection === 'E' && direction === 'N') instructions.push({ type: 'left', text: 'Turn left.' });
                }
                
                currentDirection = direction;
                straightCount = 1;
            }
        }
         // Add final straight instruction
         if (straightCount > 0) {
            instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount});
        }
        
        const nextItem = items.find(i => i.id === seg.itemId);
        if (nextItem) {
             instructions.push({ type: 'scan', text: `You've arrived. Scan for ${nextItem.name}.`, itemId: seg.itemId });
        }
    }
    
    instructions.push({type: 'finish', text: 'You found all items! Proceed to checkout.'});

    return instructions;
}
