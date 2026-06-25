// Guided-tour step definitions.
//
// Each step optionally navigates to a page, then highlights a DOM element
// matched by a data-tour selector. Steps without `target` render as a
// centered modal (used for welcome / done / live-data slides).

import type { TranslationKey } from './i18n';

export interface TourStep {
  id: string;
  /** Route to push before showing this step. */
  page?: string;
  /** CSS selector for the element to highlight. */
  target?: string;
  /** Where to place the card relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Translation keys for the card body. */
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  /** Only show this step if the predicate is true (used for admin step). */
  showIf?: (ctx: { canAdmin: boolean }) => boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    placement: 'center',
    titleKey: 'tour.welcome.title',
    bodyKey: 'tour.welcome.body',
  },
  {
    id: 'status-banner',
    page: '/dashboard/executive/overview',
    target: '[data-tour="status-banner"]',
    placement: 'bottom',
    titleKey: 'tour.banner.title',
    bodyKey: 'tour.banner.body',
  },
  {
    id: 'program-cards',
    page: '/dashboard/executive/overview',
    target: '[data-tour="program-cards"]',
    placement: 'top',
    titleKey: 'tour.programs.title',
    bodyKey: 'tour.programs.body',
  },
  {
    id: 'sidebar',
    page: '/dashboard/executive/overview',
    target: '[data-tour="sidebar"]',
    placement: 'right',
    titleKey: 'tour.sidebar.title',
    bodyKey: 'tour.sidebar.body',
  },
  {
    id: 'subnav',
    page: '/dashboard/executive/overview',
    target: '[data-tour="subnav"]',
    placement: 'bottom',
    titleKey: 'tour.subnav.title',
    bodyKey: 'tour.subnav.body',
  },
  {
    id: 'admin',
    page: '/dashboard/executive/overview',
    target: '[data-tour="admin-link"]',
    placement: 'right',
    titleKey: 'tour.admin.title',
    bodyKey: 'tour.admin.body',
    showIf: ({ canAdmin }) => canAdmin,
  },
  {
    id: 'locale-toggle',
    target: '[data-tour="locale-toggle"]',
    placement: 'bottom',
    titleKey: 'tour.locale.title',
    bodyKey: 'tour.locale.body',
  },
  {
    id: 'live',
    placement: 'center',
    titleKey: 'tour.live.title',
    bodyKey: 'tour.live.body',
  },
  {
    id: 'done',
    placement: 'center',
    titleKey: 'tour.done.title',
    bodyKey: 'tour.done.body',
  },
];
