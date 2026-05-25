export class SearchCriteria {
  constructor({
    name = "",
    type = "",
    period = "",
    location = "",
    province = "",
    has3d = null,
    userLat = null,
    userLng = null,
    sort = "newest"
  } = {}) {
    this.name = name;
    this.type = type;
    this.period = period;
    this.location = location;
    this.province = province;
    this.has3d = has3d;
    this.userLat = userLat;
    this.userLng = userLng;
    this.sort = sort;
  }

  hasKeyword() {
    return Boolean(this.name || this.type || this.period || this.location);
  }
}
