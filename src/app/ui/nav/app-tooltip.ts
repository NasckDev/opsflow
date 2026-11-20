import { Directive } from '@angular/core';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';

/** Dica ao passar o mouse ou focar: `<button appTooltip="Texto">`. */
@Directive({
  selector: '[appTooltip]',
  hostDirectives: [
    {
      directive: NzTooltipDirective,
      inputs: ['nzTooltipTitle: appTooltip', 'nzTooltipPlacement: appTooltipPlacement'],
    },
  ],
})
export class AppTooltip {}
