export class AppRolePermissionsItem {
  public id: number;
  public friendlyName: string;
  public name: string;
  public description: string;
  public parentId: number;
  public selected: boolean;
  public expandable: boolean;
  public level: number;
  public children: AppRolePermissionsItem[];
}
