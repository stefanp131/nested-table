import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { data } from '../data/Data';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  Observable,
  Subscription,
  debounceTime,
  fromEvent,
  map,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';

interface RowData {
  name: string;
  type: string;
  email: string;
  phoneNo: string;
  companyName: string;
  address: string;
  children?: RowData[];
  expanded?: boolean;
  selected?: boolean;
  highlight?: boolean; //this property is added in order to highlight the searched rows.
  hover?: boolean;
}

@Component({
  selector: 'app-nested-table',
  templateUrl: './nested-table.component.html',
  styleUrls: ['./nested-table.component.scss'],
})
export class NestedTableComponent implements OnInit, OnDestroy {
  private overallData: RowData[] = data; // the complete data array, only in a nonAPI scenario. I added the example provided 4 times.
  displayedData: RowData[] = []; // data to display in the table
  isLoading: boolean = false;
  pageSize: number = 20; // number of items to load per scroll
  currentPage: number = 0; // current page index

  loadAndSearchData$: Observable<RowData[]>;
  private searchNotEmpty$: Observable<RowData[]>;

  private searchResultWithParents: RowData[] = [];
  searchForm: FormGroup;
  private searching = false;

  private scrolling$: Observable<void>;
  private scrollingSubscription: Subscription;
  selected: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMoreData();
    this.prepareObservables();
    this.infiniteScrolling();
  }

  ngOnDestroy(): void {
    this.scrollingSubscription.unsubscribe();
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      search: [''],
    });
  }

  private loadMoreData() {
    this.isLoading = true;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    //simulate the fetching from an API for infinite scrolling
    setTimeout(() => {
      if (startIndex < this.overallData.length) {
        this.displayedData = this.displayedData.concat(
          this.overallData.slice(startIndex, endIndex)
        );

        //remerge for a new reference, otherwise the async won't trigger.
        //the async will unsubscribe from the oldest reference and will subscribe to the new one. No memory loss.
        this.loadAndSearchData$ = merge(
          of(this.displayedData),
          this.searchNotEmpty$
        );

        this.currentPage++;
      }

      this.isLoading = false;
    }, 1000);
  }

  private prepareObservables() {
    this.searchNotEmpty$ = this.searchForm.get('search').valueChanges.pipe(
      debounceTime(500),
      map((term) => {
        if (term) {
          this.overallData = JSON.parse(JSON.stringify(data));

          this.searchForName(this.overallData, term);
          return term;
        }

        this.reset(); //if there is no term in the search we reset
        return undefined;
      }),
      switchMap((term) =>
        term
          ? of(
              this.searchResultWithParents.filter(
                (item) => this.overallData.includes(item) // we take only the highest parents
              )
            )
          : of(this.displayedData)
      ),
      tap(() => (this.searchResultWithParents = [])) //clean in order to not pollute future searches
    );

    //we merge this in order to have a single observable on the view
    this.loadAndSearchData$ = merge(
      of(this.displayedData),
      this.searchNotEmpty$
    );
  }

  //search recursively for the rows that respect the match.
  //populate the global variable searchResultWithParents with the parents.
  //after this we will select only the highest parent.
  private searchForName(data: RowData[], targetName: string): RowData[] {
    const matchingRows: RowData[] = [];
    this.searching = true;

    for (const item of data) {
      if (item.children) {
        const childMatches = this.searchForName(item.children, targetName);
        if (childMatches.length > 0) {
          item.expanded = true;
          if (!this.searchResultWithParents.includes(item)) {
            this.searchResultWithParents.push(item);
          }
          matchingRows.push(...childMatches);
        }
      }

      if (item.name.toLowerCase().includes(targetName.toLowerCase())) {
        item.highlight = true;
        if (!this.searchResultWithParents.includes(item)) {
          this.searchResultWithParents.push(item);
        }
        matchingRows.push(item);
      }
    }

    return matchingRows;
  }

  //when you are near the bottom of the scroll load more data
  private infiniteScrolling() {
    const containerElement =
      this.elementRef.nativeElement.querySelector('#container');

    this.scrolling$ = fromEvent(containerElement, 'scroll').pipe(
      debounceTime(500),
      map((event: Event) => {
        if (
          event.target['offsetHeight'] + event.target['scrollTop'] >=
            event.target['scrollHeight'] - 100 &&
          !this.searching
        )
          this.loadMoreData();
      })
    );

    this.scrollingSubscription = this.scrolling$.subscribe();
  }

  private reset() {
    this.overallData = JSON.parse(JSON.stringify(data));
    this.isLoading = true;
    this.currentPage = 0;
    this.displayedData = [];
    this.searching = false;
    this.loadMoreData();
  }

  toggleExpand(row: RowData): void {
    row.expanded = !row.expanded;
  }

  onSelected(event: any, rowData: RowData) {
    rowData.selected = event.target['checked'];

    this.selected = !rowData.selected
      ? this.selectedRows(this.displayedData).length > 0
      : true;
  }

  //search recursively for a selected row
  private selectedRows(data: RowData[]): RowData[] {
    const matchingRows: RowData[] = [];

    for (const item of data) {
      if (item.children) {
        const childMatches = this.selectedRows(item.children);
        if (childMatches.length > 0) {
          matchingRows.push(...childMatches);
        }
      }

      if (item.selected) {
        matchingRows.push(item);
      }
    }

    return matchingRows;
  }
}
