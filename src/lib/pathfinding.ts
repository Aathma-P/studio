import type { MapPoint, ShoppingListItem } from './types';
import { STORE_LAYOUT, ENTRANCE_POS, CHECKOUT_POS } from './data';

class Node {
    constructor(
        public parent: Node | null,
        public pos: MapPoint,
        public g = 0,
        public h = 0,
        public f = 0
    ) {}

    equals(other: Node) {
        return this.pos.x === other.pos.x && this.pos.y === other.pos.y;
    }
}

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

            if (grid[nodePos.y][nodePos.x] === 1) { // 1 is a shelf (obstacle)
                continue;
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

        openList.push(...children);
    }

    return null; 
}


export type InstructionType = 'start' | 'straight' | 'left' | 'right' | 'turn-left' | 'turn-right' | 'scan' | 'finish';
export interface Instruction {
    type: InstructionType;
    text: string;
    distance?: number;
    itemId?: string;
    pathPoint: MapPoint;
}

const getAisleNavX = (aisle: number) => (aisle - 1) * 2 + 2;


export function getTurnByTurnInstructions(items: ShoppingListItem[]): Instruction[] {
    const instructions: Instruction[] = [];
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

    
    let fullPath: MapPoint[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = findPath(waypoints[i].point, waypoints[i+1].point, STORE_LAYOUT);
        if (segment) {
            const segmentToAdd = i === 0 ? segment : segment.slice(1);
            fullPath = fullPath.concat(segmentToAdd);
        }
    }

    if(fullPath.length < 2) return instructions;

    instructions.push({ type: 'start', text: 'Start at the entrance. Follow the path.', pathPoint: fullPath[0] });

    let currentDirection: 'N'|'S'|'E'|'W' | null = null;
    let straightCount = 0;
    
    for (let j = 1; j < fullPath.length; j++) {
        const p1 = fullPath[j-1];
        const p2 = fullPath[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        let direction: 'N'|'S'|'E'|'W';
        if (dy < 0) direction = 'N';
        else if (dy > 0) direction = 'S';
        else if (dx > 0) direction = 'E';
        else direction = 'W';

        const waypointIndex = waypoints.findIndex(wp => wp.point.x === p2.x && wp.point.y === p2.y);
        const isAtWaypoint = waypointIndex > 0;

        if (direction === currentDirection && !isAtWaypoint) {
            straightCount++;
        } else {
            if (straightCount > 0) {
                 instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount, pathPoint: p1});
            }
            
            if (currentDirection) {
                let turnText = "";
                let turnType: InstructionType = 'straight';
                if (currentDirection === 'N' && direction === 'W') { turnType = 'left'; turnText = 'Turn left'; }
                else if (currentDirection === 'N' && direction === 'E') { turnType = 'right'; turnText = 'Turn right'; }
                else if (currentDirection === 'S' && direction === 'W') { turnType = 'right'; turnText = 'Turn right'; }
                else if (currentDirection === 'S' && direction === 'E') { turnType = 'left'; turnText = 'Turn left'; }
                else if (currentDirection === 'W' && direction === 'S') { turnType = 'left'; turnText = 'Turn left'; }
                else if (currentDirection === 'W' && direction === 'N') { turnType = 'right'; turnText = 'Turn right'; }
                else if (currentDirection === 'E' && direction === 'S') { turnType = 'right'; turnText = 'Turn right'; }
                else if (currentDirection === 'E' && direction === 'N') { turnType = 'left'; turnText = 'Turn left'; }

                if (turnText) {
                    instructions.push({ type: turnType, text: turnText, pathPoint: p1 });
                }
            }
            
            currentDirection = direction;
            straightCount = 1;
        }

        if (isAtWaypoint) {
             if (straightCount > 0) {
                instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount, pathPoint: p2});
            }
            straightCount = 0;
            
            const waypoint = waypoints[waypointIndex];
            const item = sortedItems.find(it => it.id === waypoint.itemId);
            if (item) {
                const itemShelfX = (item.location.aisle - 1) * 2 + 1;
                const turnDirection = itemShelfX < waypoint.point.x ? 'left' : 'right';
                const turnInstructionType = turnDirection === 'left' ? 'turn-left' : 'turn-right';
                instructions.push({ type: turnInstructionType, text: `Item is on your ${turnDirection}`, pathPoint: p2 });
                instructions.push({ type: 'scan', text: `Scan for ${item.name}`, itemId: item.id, pathPoint: p2 });
            }
        }
    }

    if (straightCount > 0) {
        instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount, pathPoint: fullPath[fullPath.length - 1]});
    }

    instructions.push({type: 'finish', text: 'You found all items! Proceed to checkout.', pathPoint: CHECKOUT_POS});

    return instructions;
}
