
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { paginationPageSizeOptions } from '../../../../libs/pagination';
import { PaginationComponent } from '../pagination/pagination';

type StockLevelRow = {
  id: number;
  quantity: number;
  product?: {
    name?: string;
    category?: {
      name?: string;
    } | null;
  };
  warehouse?: {
    name?: string;
  };
};

@Component({
  selector: 'app-basic-table-five',
  imports: [PaginationComponent],
  templateUrl: './basic-table-five.component.html',
  styles: ``
})
export class BasicTableFiveComponent implements OnInit {
  tableData: Array<{
    id: number;
    name: string;
    category: string;
    country: string;
    cr: string;
    value: string;
  }> = [];

  currentPage = 1;
  itemsPerPage = paginationPageSizeOptions[0];
  pageSizeOptions = paginationPageSizeOptions;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<StockLevelRow[]>(`${environment.apiUrl}/stock-levels`)
      .subscribe({
        next: (rows) => {
          this.tableData = rows.map((row, index) => ({
            id: row.id,
            name: row.product?.name ?? 'Unknown Product',
            category: row.product?.category?.name ?? 'Uncategorized',
            country: `/images/country/country-0${(index % 7) + 1}.svg`,
            cr: row.warehouse?.name ?? 'N/A',
            value: String(row.quantity ?? 0),
          }));
          this.currentPage = 1;
        },
      });
  }

  get totalPages(): number {
    return Math.ceil(this.tableData.length / this.itemsPerPage);
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableData.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setItemsPerPage(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  handleFilter() {
    console.log('Filter clicked');
    // Add your filter logic here
  }

  handleSeeAll() {
    console.log('See all clicked');
    // Add your see all logic here
  }
}
