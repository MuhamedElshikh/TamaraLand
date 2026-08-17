import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bannres } from './bannres';

describe('Bannres', () => {
  let component: Bannres;
  let fixture: ComponentFixture<Bannres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bannres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bannres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
