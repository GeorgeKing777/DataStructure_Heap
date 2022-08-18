/*-------------------------------------------------
    -----------------------------------------------
        容器：基于最大堆的优先级队列
        注意：
            1、元素插入时会设置heap_index和insertion_index
                heap_index（hi）是元素在堆数组中的索引，插入堆/堆内移动/从堆中移除时都需要维护，移除时置为-1！！！！！！！！！！
                insertion_index（ii）表示第几个插入这个堆的元素；相同优先级的，插入越早优先级越高；同时也用于比较函数，永远不会相等。
            2、默认越大优先级越高
                comparer是函数，参数是2个元素。如果前者比后者优先级高，返回1；如果后者比前者优先级高，返回-1；相同，返回0。
    -----------------------------------------------
    -----------------------------------------------*/

export enum CheckPriorityMethod
{
    CPM_CUSTOM = 1,
    CPM_GREATER = 2,
    CPM_LESS = 3,
}

export interface HeapItem {
    heap_index : number;
    insertion_index : number;
}

export default class Heap<T extends HeapItem> {
    private m_array : Array<T> = new Array<T>();
    private m_item_ever_enqueued : number = 0;
    private m_CheckPriority : (higher : T, lower : T) => boolean;
    private m_comparer : (higher : T, lower : T) => number;

    constructor(cpm : CheckPriorityMethod, comparer : ((higher : T, lower : T) => number)) {
        switch (cpm) {
            case CheckPriorityMethod.CPM_CUSTOM:
                this.m_CheckPriority = this.CheckPriorityByComparer;
                this.m_comparer = comparer;
                break;
            case CheckPriorityMethod.CPM_GREATER:
                this.m_CheckPriority = this.CheckPriorityByGreater;
                break;
            case CheckPriorityMethod.CPM_LESS:
                this.m_CheckPriority = this.CheckPriorityByLess;
                break;
            default:
                this.m_CheckPriority = this.CheckPriorityByGreater;
                break;
        }
    }

    get Size() : number {
        return this.m_array.length;
    }

    //返回最优先的元素
    Peek() : T {
        if (this.m_array.length > 0) {
            return this.m_array[0];
        }
        return null;
    }

    //插入（如果已经在队列，会变成更新）
    Enqueue(item : T) : void {
        if (!item) {
            return;
        }
        if (item.heap_index < 0) {
            // 插入时设置
            item.heap_index = this.m_array.push(item) - 1;
            item.insertion_index = ++this.m_item_ever_enqueued;
        }
        this.UpdatePriorityByIndex(item.heap_index);
    }

    //移除最优先的
    Dequeue() : T {
        return this.RemoveByIndex(0);
    }

    //随意删除（根据元素）
    Remove(item : T) : void {
        if (item && item.heap_index >= 0) {
            this.RemoveByIndex(item.heap_index);
        }
    }
    
    //随意删除（根据堆索引）
    private RemoveByIndex(hi : number) : T {
        if (!this.ValidIndex(hi)) {
            return null;
        }
        let item = this.m_array[hi];
        item.heap_index = -1;  // 移除置为-1
        if (hi == this.m_array.length - 1) {
            this.m_array.pop();
        } else {
            let temp = this.m_array.pop();
            temp.heap_index = hi; // 移动时维护
            this.m_array[hi] = temp;
            this.UpdatePriorityByIndex(hi);
        }
        return item;
    }
    
    //动态更新（根据堆索引）
    private UpdatePriorityByIndex(hi : number) : void {
        let parent = this.Parent(hi);
        if (this.ValidIndex(parent) && this.m_CheckPriority(this.m_array[hi],this.m_array[parent])) {
            this.CascadeUp(hi);
        } else {
            this.CascadeDown(hi);
        }
    }

    //交换
    private Swap(i : number, j : number) : void {
        let item_i = this.m_array[i];
        let item_j = this.m_array[j];
        this.m_array[i] = item_j;
        this.m_array[j] = item_i;
        item_i.heap_index = j; // 移动时维护
        item_j.heap_index = i; // 移动时维护
    }

    //向上调整
    private CascadeUp(hi : number) {
        let parent = this.Parent(hi);
        while (this.ValidIndex(parent) && this.m_CheckPriority(this.m_array[hi],this.m_array[parent])) {
            this.Swap(hi, parent);
            hi = parent;
            parent = this.Parent(hi);
        }
    }

    //向下调整
    private CascadeDown(hi : number) {
        let l;
        let r;
        let largest = hi;
        while (true) {
            l = this.Left(hi);
            r = this.Right(hi);
            if (this.ValidIndex(l) && this.m_CheckPriority(this.m_array[l],this.m_array[largest])) {
                largest = l;
            }
            if (this.ValidIndex(r) && this.m_CheckPriority(this.m_array[r],this.m_array[largest])) {
                largest = r;
            }
            if (largest == hi) {
                break;
            }
            this.Swap(hi, largest);
            hi = largest;
        }
    }

    // 取父节点的索引
    private Parent(hi : number) : number {
        return Math.floor(0.5 * (hi-1));
    }

    // 取左子节点的索引
    private Left(hi : number) : number {
        return 2 * hi + 1;
    }

    // 取右子节点的索引
    private Right(hi : number) : number {
        return 2 * hi + 2;
    }

    private ValidIndex(hi : number) : boolean {
        if (hi < 0 || hi > this.m_array.length - 1) {
            return false;
        }
        return true;
    }

    //根据元表进行优先级比较，越大优先级越高
    private CheckPriorityByGreater(higher : T, lower : T) : boolean {
        if (higher > lower) {
            return true;
        } else if (higher < lower) {
            return false;
        } else {
            return higher.insertion_index < lower.insertion_index;
        }
    }

    //根据元表进行优先级比较，越小优先级越高
    private CheckPriorityByLess(higher : T, lower : T) : boolean {
        if (higher < lower) {
            return true;
        } else if (higher > lower) {
            return false;
        } else {
            return higher.insertion_index < lower.insertion_index;
        }
    }

    //根据自定义比较函数进行优先级比较
    private CheckPriorityByComparer(higher : T, lower : T) : boolean {
        let result = this.m_comparer(higher,lower);
        if (result > 0) {
            return true;
        } else if (result < 0) {
            return false;
        } else {
            return higher.insertion_index < lower.insertion_index;
        }
    }
}