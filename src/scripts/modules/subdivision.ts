import bus from '../extensions/event';
import { Module } from '../extensions/module';
import Storage from '../extensions/storage';

const SUBDIVISION = [
    [1], // 4
    [1, 1], // 8-8
    [1, 0, 1, 1], // 8-16-16
    [1, 1, 1, 0], // 16-16-8
    [1, 1, 1, 1], // 16-16-16-16
    [1, 1, 1], // triplet-8
    [1, 0, 0, 1], // 8dot-16
    [1, 1, 0, 0], // 16-8dot
];

const DEFAULT_SUBDIVISION = 0;
const MIN_SUBDIVISION = 0;
const MAX_SUBDIVISION = SUBDIVISION.length - 1;

class SubdivisionModule extends Module {
    private currentSubdivision: number = DEFAULT_SUBDIVISION;
    private subdivisionList: HTMLDivElement[] = [];

    mount(): void {
        this.currentSubdivision = Storage.loadInt('subdivision', DEFAULT_SUBDIVISION);
        if (this.currentSubdivision < MIN_SUBDIVISION || this.currentSubdivision > MAX_SUBDIVISION) {
            this.currentSubdivision = DEFAULT_SUBDIVISION; // Reset to default if out of bounds
        }

        this.subdivisionList = [...document.querySelectorAll<HTMLDivElement>('#sub-list .item')];
        this.subdivisionList[this.currentSubdivision].classList.add('active');

        bus.on('change-subdivision', this.onChangeSubdivision.bind(this));

        bus.emit('subdivision-changed', SUBDIVISION[this.currentSubdivision]);
    }

    private onChangeSubdivision(subdivision: number): void {
        if (subdivision < MIN_SUBDIVISION || subdivision > MAX_SUBDIVISION) {
            subdivision = DEFAULT_SUBDIVISION; // Reset to default if out of bounds
        }
        if (this.currentSubdivision === subdivision) {
            return; // No change
        }

        this.subdivisionList[this.currentSubdivision].classList.remove('active');
        this.currentSubdivision = subdivision;
        this.subdivisionList[this.currentSubdivision].classList.add('active');

        Storage.save('subdivision', this.currentSubdivision);

        bus.emit('subdivision-changed', SUBDIVISION[this.currentSubdivision]);
    }
}

export default SubdivisionModule;
