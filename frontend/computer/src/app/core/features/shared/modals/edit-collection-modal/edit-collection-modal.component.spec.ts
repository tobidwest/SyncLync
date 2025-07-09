import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCollectionModalComponent } from './edit-collection-modal.component';

describe('EditCollectionModalComponent', () => {
  let component: EditCollectionModalComponent;
  let fixture: ComponentFixture<EditCollectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCollectionModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCollectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
