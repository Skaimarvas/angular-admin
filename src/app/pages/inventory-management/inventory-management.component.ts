import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BasicTableFiveComponent } from '../../shared/components/tables/basic-tables/basic-table-five/basic-table-five.component';

@Component({
  selector: 'app-inventory-management',
  imports: [PageBreadcrumbComponent, ComponentCardComponent, BasicTableFiveComponent],
  templateUrl: './inventory-management.component.html',
  styles: ``,
})
export class InventoryManagementComponent {}
