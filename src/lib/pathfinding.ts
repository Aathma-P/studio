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
    if (items.length === 0) {
        instructions.push({ type: 'finish', text: 'Add items to your list to begin.', pathPoint: ENTRANCE_POS });
        return instructions;
    };

    const waypoints: {point: MapPoint, item?: ShoppingListItem}[] = [
        { point: ENTRANCE_POS },
        ...items.map(item => ({
            point: {
                x: getAisleNavX(item.location.aisle),
                y: item.location.section,
            },
            item: item
        })),
        { point: CHECKOUT_POS },
    ];
    
    let fullPath: MapPoint[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = findPath(waypoints[i].point, waypoints[i+1].point, STORE_LAYOUT);
        if (segment) {
            const segmentToAdd = i === 0 ? segment : segment.slice(1);
            fullPath = fullPath.concat(segmentToAdd);
        }
    }

    if(fullPath.length < 2) {
        instructions.push({ type: 'finish', text: 'Cannot calculate path.', pathPoint: ENTRANCE_POS });
        return instructions;
    }

    instructions.push({ type: 'start', text: 'Start at the entrance', pathPoint: fullPath[0] });

    let currentDirection: 'N'|'S'|'E'|'W' | null = null;
    let straightCount = 0;
    
    for (let j = 1; j < fullPath.length; j++) {
        const p1 = fullPath[j-1];
        const p2 = fullPath[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        let newDirection: 'N'|'S'|'E'|'W';
        if (dy < 0) newDirection = 'N';
        else if (dy > 0) newDirection = 'S';
        else if (dx > 0) newDirection = 'E';
        else newDirection = 'W';

        if (!currentDirection) {
            currentDirection = newDirection;
        }

        const waypoint = waypoints.find(wp => wp.point.x === p1.x && wp.point.y === p1.y);
        
        if (newDirection !== currentDirection) {
            if (straightCount > 0) {
                 instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount, pathPoint: p1, itemId: waypoint?.item?.id});
            }
            
            let turnText = "";
            let turnType: InstructionType = 'straight';
            if (currentDirection === 'N' && newDirection === 'W') { turnType = 'left'; turnText = 'Turn left'; }
            else if (currentDirection === 'N' && newDirection === 'E') { turnType = 'right'; turnText = 'Turn right'; }
            else if (currentDirection === 'S' && newDirection === 'W') { turnType = 'right'; turnText = 'Turn right'; }
            else if (currentDirection === 'S' && newDirection === 'E') { turnType = 'left'; turnText = 'Turn left'; }
            else if (currentDirection === 'W' && newDirection === 'S') { turnType = 'left'; turnText = 'Turn left'; }
            else if (currentDirection === 'W' && newDirection === 'N') { turnType = 'right'; turnText = 'Turn right'; }
            else if (currentDirection === 'E' && newDirection === 'S') { turnType = 'right'; turnText = 'Turn right'; }
            else if (currentDirection === 'E' && newDirection === 'N') { turnType = 'left'; turnText = 'Turn left'; }

            if (turnText) {
                instructions.push({ type: turnType, text: turnText, pathPoint: p1, itemId: waypoint?.item?.id });
            }
            
            currentDirection = newDirection;
            straightCount = 1;
        } else {
             straightCount++;
        }

        if (waypoint?.item && waypoint.point.x === p2.x && waypoint.point.y === p2.y) {
             if (straightCount > 1) {
                instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount-1, pathPoint: p1, itemId: waypoint.item.id});
             }
            
            const item = waypoint.item;
            const itemShelfX = (item.location.aisle - 1) * 2 + 1;
            const turnDirection = itemShelfX < waypoint.point.x ? 'left' : 'right';
            const turnInstructionType = turnDirection === 'left' ? 'turn-left' : 'turn-right';
            
            instructions.push({ type: turnInstructionType, text: `Item is on your ${turnDirection}`, pathPoint: p2, itemId: item.id });
            instructions.push({ type: 'scan', text: `Scan for ${item.name}`, itemId: item.id, pathPoint: p2 });
            straightCount = 0;
        }
    }

    if (straightCount > 0) {
        instructions.push({type: 'straight', text: `Proceed straight`, distance: straightCount, pathPoint: fullPath[fullPath.length - 1]});
    }

    instructions.push({type: 'finish', text: 'Proceed to checkout.', pathPoint: CHECKOUT_POS});

    return instructions;
}
