
import { Component } from '@angular/core';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { TableDropdownComponent } from '../../../common/table-dropdown/table-dropdown.component';

@Component({
  selector: 'app-basic-table-four',
  imports: [
    BadgeComponent,
    TableDropdownComponent
],
  templateUrl: './basic-table-four.component.html',
  styles: ``
})
export class BasicTableFourComponent {
  campaigns: Array<{
    id: number;
    creator: { image: string; name: string };
    campaign: { image: string; name: string; type: string };
    status: string;
  }> = [];

  handleViewMore() {
    console.log('View More clicked');
    // Add your view more logic here
  }

  handleDelete() {
    console.log('Delete clicked');
    // Add your delete logic here
  }
}
