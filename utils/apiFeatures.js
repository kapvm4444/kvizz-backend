class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //NOTE
    // 1A. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //NOTE
    // 1B. Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gt|lt|gte|lte)\b/g, (match) => `$${match}`),
    );
    this.query = this.query.find(queryStr);

    return this;
  }

  //NOTE
  // 2. Sorting
  sort() {
    let sortBy = this.queryString.sort;
    if (sortBy) {
      sortBy = sortBy.split(',').join(' ');
      //because we need to pass space seperated values
    } else {
      sortBy = '-createdAt';
    }
    this.query.sort(sortBy);
    return this;
  }

  //NOTE
  // 3.Field Limiting
  limitField() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }

    return this;
  }

  //NOTE
  // 4. Pagination
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
