/** Which view Activities shows, remembered in this browser. */
export type ActivitiesView = 'list' | 'weeks';

const KEY = 'forma.activitiesView';

export function readView(): ActivitiesView {
  try {
    return localStorage.getItem(KEY) === 'weeks' ? 'weeks' : 'list';
  } catch {
    return 'list';
  }
}

export function saveView(view: ActivitiesView) {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    // Private windows can refuse storage; the view still switches.
  }
}
