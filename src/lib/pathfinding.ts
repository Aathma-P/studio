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

            // Treat shelves (1), entrance (2) and checkout (3) as obstacles, unless it's the destination
            if (grid[nodePos.y][nodePos.x] === 1 || grid[nodePos.y][nodePos.x] === 2 || grid[nodePos.y][nodePos.x] === 3) {
                 if (nodePos.x === endNode.pos.x && nodePos.y === endNode.pos.y) {
                    // It's the destination, so it's fine
                 } else {
                    continue;
                 }
            }

            const newNode = new Node(currentNode, nodePos);
            
            if (closedList.some(closedChild => closedChild.equals(newNode))) {
                continue;
            }

            newNode.g = currentNode.g + 1;
            newNode.h = heuristic(newNode.pos, endNode.pos);
            newNode.f = newNode.g + newNode.h;

            if (openList.some(openNode => newNode.equals(openNode) && newNode.g >= openNode.g)) {
                continue;
            }

            children.push(newNode);
        }

        for (const child of children) {
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

const getAisleNavX = (aisle: number) => aisle * 2;


export function getTurnByTurnInstructions(items: ShoppingListItem[]): Instruction[] {
    if (items.length === 0) return [];

     const sortedItems = [...items].sort((a, b) => {
        if (a.location.aisle !== b.location.aisle) {
            return a.location.aisle - b.location.aisle;
        }
        return a.location.section - b.location.section;
    });

    const waypoints: {point: MapPoint, itemId: string}[] = [
        { point: ENTRANCE_POS, itemId: 'entrance' },
        ...sortedItems.map(item => ({
            point: {
                x: getAisleNavX(item.location.aisle),
                y: item.location.section,
            },
            itemId: item.id
        })),
        { point: CHECKOUT_POS, itemId: 'checkout' },
    ];

    const instructions: Instruction[] = [];
    if (waypoints.length < 2) return [];

    instructions.push({ type: 'start', text: 'Start at the entrance. Follow the path.' });

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i+1];
        
        const path = findPath(start.point, end.point, STORE_LAYOUT);

        if (!path || path.length < 2) continue;

        let currentDirection: 'N'|'S'|'E'|'W' | null = null;
        let straightCount = 0;

        for (let j = 1; j < path.length; j++) {
            const p1 = path[j-1];
            const p2 = path[j];
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
                if (straightCount > 0) {
                     instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount});
                }
                
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
         if (straightCount > 0) {
            instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount});
        }
        
        const nextItem = sortedItems.find(item => item.id === end.itemId);
        if (nextItem) {
             instructions.push({ type: 'scan', text: `You've arrived. Scan for ${nextItem.name}.`, itemId: end.itemId });
        }
    }
    
    instructions.push({type: 'finish', text: 'You found all items! Proceed to checkout.'});

    return instructions;
}
