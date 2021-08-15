import { NestedTreeControl } from '@angular/cdk/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, Injectable, ChangeDetectorRef } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { AppRolePermissionsItem } from './app-role-permissions-item';
import { ToastrService } from 'ngx-toastr';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
// interface FoodNode {
//   name: string;
//   children?: FoodNode[];
// }
const TREE_DATA = [
    {
        "id": 1,
        "friendlyName": "Parent1",
        "name": "Parent1",
        "description": "Parent 1",
        "selected": false,
        "parentId": null,
        "children": [
            {
                "id": 3,
                "friendlyName": "Child 1.1",
                "name": "Child1.1",
                "description": "Child 1.1",
                "selected": false,
                "parentId": 1,
                "children": [
                    {
                      "id": 3,
                      "friendlyName": "Child 1.1.1",
                      "name": "Child1.1.1",
                      "description": "Child 1.1.1",
                      "selected": false,
                      "parentId": 3,
                      "children": []
            }]
            },
            {
                "id": 4,
                "friendlyName": "Child 1.2",
                "name": "Child1.2",
                "description": "Child 1.2",
                "selected": true,
                "parentId": 1,
                "children": []
            },
            {
                "id": 5,
                "friendlyName": "Child 1.3",
                "name": "Child1.3",
                "description": "Child 1.3",
                "selected": false,
                "parentId": 1,
                "children": []
            }
        ]
    },
    {
        "id": 2,
        "friendlyName": "Parent2",
        "name": "Parent2",
        "description": "Parent 2",
        "selected": true,
        "parentId": null,
        "children": [
            {
                "id": 6,
                "friendlyName": "Child 2.1",
                "name": "Child 2.1",
                "description": "Child 2.1",
                "selected": true,
                "parentId": 2,
                "children": []
            },
            {
                "id": 7,
                "friendlyName": "Child 2.2",
                "name": "Child 2.2",
                "description": "Child 2.2",
                "selected": true,
                "parentId": 2,
                "children": []
            },
            {
                "id": 8,
                "friendlyName": "Child 2.3",
                "name": "Child 2.3",
                "description": "Child 2.3",
                "selected": true,
                "parentId": 2,
                "children": []
            }
        ]
    }
];

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<AppRolePermissionsItem[]>([]);

  get data(): AppRolePermissionsItem[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = TREE_DATA;

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number): AppRolePermissionsItem[] {
    return Object.keys(obj).reduce<AppRolePermissionsItem[]>((accumulator, key) => {
      const node = new AppRolePermissionsItem();
      const value = obj[key];
      node.name = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.name = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: AppRolePermissionsItem, name: string) {
    if (parent.children) {
      parent.children.push({name: name} as AppRolePermissionsItem);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: AppRolePermissionsItem, name: string) {
    console.log(node.name);
    node.name = name;
    this.dataChange.next(this.data);
  }
}


/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'tree-checklist-example',
  templateUrl: './tree-checklist-example.html',
  styleUrls: ['./tree-checklist-example.css'],
  providers: [ChecklistDatabase]
})
export class TreeExampleComponent {
  // treeControl = new NestedTreeControl<AppRolePermissionsItem>(node => node.children);
  treeControl: FlatTreeControl<AppRolePermissionsItem>;
  dataSource = new MatTreeNestedDataSource<AppRolePermissionsItem>();
  checklistSelection = new SelectionModel<AppRolePermissionsItem>(true /* multiple */);

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<AppRolePermissionsItem, AppRolePermissionsItem>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<AppRolePermissionsItem, AppRolePermissionsItem>();

  /** A selected parent node to be AppRolePermissionsItem */
  selectedParent: AppRolePermissionsItem | null = null;

  /** The new item's name */
  newItemName = '';


  treeFlattener: MatTreeFlattener<AppRolePermissionsItem, AppRolePermissionsItem>;

  rolePermissionsForm: FormGroup;

  constructor(private _database: ChecklistDatabase, private fb: FormBuilder, private changeDetectorRef: ChangeDetectorRef) {
    this.rolePermissionsForm = this.fb.group({
      //   permissionsRoleList: [null, Validators.required],
      //   matSelect: [],
      //   matSelectChild: [],
    });

    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<AppRolePermissionsItem>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);


    _database.dataChange.subscribe(data => {
      this.dataSource.data = data;
      this.dataSource.data.forEach(row => {
          if (row.selected == true) {
          this.nodeSelectionToggle({expandable: true, friendlyName: "Parent2", id: 2, level: 0,name: "Parent2", description: "", parentId: 0, children:[], selected: true});
        }
      });
    });
  }

  /** Toggle the game selection. Select/deselect all the descendants node */
  nodeSelectionToggle(node: AppRolePermissionsItem): void {
    console.log(node);
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants, node)
      : this.checklistSelection.deselect(...descendants, node);
    this.changeDetectorRef.markForCheck();
  }

  getLevel = (node: AppRolePermissionsItem) => node.level;

  isExpandable = (node: AppRolePermissionsItem) => node.expandable;

  getChildren = (node: AppRolePermissionsItem): AppRolePermissionsItem[] => node.children;

  hasChild = (_: number, _nodeData: AppRolePermissionsItem) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: AppRolePermissionsItem) => _nodeData.friendlyName === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: AppRolePermissionsItem, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.name === node.name
      ? existingNode
      : new AppRolePermissionsItem();
    flatNode.name = node.name;
    flatNode.id = node.id;
    flatNode.friendlyName = node.friendlyName;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: AppRolePermissionsItem): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: AppRolePermissionsItem): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: AppRolePermissionsItem): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: AppRolePermissionsItem): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: AppRolePermissionsItem): void {
    let parent: AppRolePermissionsItem | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: AppRolePermissionsItem): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: AppRolePermissionsItem): AppRolePermissionsItem | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
  saveRolePermissionChanges() {
    var values = this.checklistSelection.selected;
    console.log(values);
  }
}

