if (!Object.entries) {
    Object.entries = function( obj ){
      var ownProps = Object.keys( obj ),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
      while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
  
      return resArray;
    };
}

var MovieRating = MovieRating || {};
MovieRating.LIKE = 1;
MovieRating.DISLIKE = -1;

var MovieDefaults = {};
MovieDefaults.POSTER_THUMBNAIL = 'images/video.png';

/**
 * Manages the movies booking page
 * @param {*} options 
 */
function FilmsBookingController(options) {
    this.api = options.api || {};
    this.apiHelper = new ApiHelper(options.api);
    this.bookedMovies = [];
    this.availableMovies = [];
    this.medicineFields = [];
    this.searchBar = false;
    /**
     * The modal should be on the page!
     */
    this.movieInfoModal = new MovieInformationModal('movie-information-modal');

    this.init = function() {
        this._setupEventHandlers();

        this._fetchInitialData({
            success: function() { 
                this._setupSearchBar()
                this._initPagination()
                this._renderManageScreen()
            }.bind(this),
            error: function(error) { this._showError(error) }.bind(this)
        });
    }

    this._setupEventHandlers = function() {
        $(document).on('click', '.btn-book', this._handleClickBookMovie);
        $(document).on('click', '.btn-unbook', this._handleClickUnbookMovie);
        $(document).on('click', '.btn-like', this._handleClickLikeMovie);
        $(document).on('click', '.btn-dislike', this._handleClickDislikeMovie);
        $(document).on('click', '.btn-show-info', this._handleClickShowInfo);
    }

    /**
     * Book movie btn click handler
     */
    this._handleClickBookMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        if (movieId) {
            this._bookMovie(movieId);
        }
    }.bind(this);

    this._detectMovieIdByEvent = function(e) {
        var videoThumbnail = $(e.target).closest('.video-thumbnail');
        var movieId = videoThumbnail.attr('data-id');
        if (!movieId) {
            console.error('video thumbnail should have id. what is going on?')
            return false;
        }
        return movieId;
    }

    this._bookMovie = function(movieId) {
        var movie = this.availableMovies.find(function(movie) {
            return movie.id == movieId
        });

        if (!movie) {
            console.error(`no unbooked movie with id: ${movieId}`)
            return;
        }

        // TODO: show please wait dialog?
        this.apiHelper.toggleBookMovie(movie.id, true)
            .done(function(data) {
                this.availableMovies = this.availableMovies.filter(function(elem) { return elem.id != movie.id })
                movie.booked = true;
                this.bookedMovies.push(movie);
                this._refreshMovieThumbnail(movie);
                this._renderManageScreen();
            }.bind(this))
            .fail(function(e) {
                console.error("Can't post book request:", e.statusText);
            })
    }

    /**
     * Unbook movie btn click handler
     */
    this._handleClickUnbookMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        if (movieId) {
            this._unbookMovie(movieId);
        }
    }.bind(this);

    this._unbookMovie = function(movieId) {
        var movie = this.bookedMovies.find(function(movie) {
            return movie.id == movieId
        });

        if (!movie) {
            console.error(`no booked movie with id: ${movieId}`)
            return;
        }

        // TODO: show please wait dialog
        this.apiHelper.toggleBookMovie(movie.id, false)
            .done(function(data) {
                this.bookedMovies = this.bookedMovies.filter(function(elem) { return elem.id != movie.id })
                movie.booked = false;
                this.availableMovies.push(movie);
                this._refreshMovieThumbnail(movie);
                this._renderManageScreen();
            }.bind(this))
            .fail(function(e) {
                console.error("Can't post book request:", e.statusText);
            })
    }

    /**
     * Like movie btn click handler
     */
     this._handleClickLikeMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        if (movieId) {
            this._toggleMovieRating(movieId, MovieRating.LIKE);
        }
    }.bind(this);

    this._toggleMovieRating = function(movieId, rating) {
        var movie = this._findMovie(movieId);
        if (movie) {
            var newRating = rating == movie.rating ? null : rating;
            this.apiHelper.saveRating(movieId, newRating).done(function() {
                movie.rating = newRating;
                this._refreshMovieThumbnail(movie);
            }.bind(this))
        }
    }

    this._findMovie = function(movieId) {
        return this.availableMovies.find(function(movie) { return movie.id == movieId }) ||
                this.bookedMovies.find(function(movie) { return movie.id == movieId });
    }

    this._refreshMovieThumbnail = function(movie) {
        var thumbnail = $(`.video-thumbnail[data-id=${movie.id}]`);
        MovieThumbnailUtils.refreshThumbnailState(thumbnail, movie);
    }

    /**
     * Dislike movie btn click handler
     */
     this._handleClickDislikeMovie = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        if (movieId) {
            this._toggleMovieRating(movieId, MovieRating.DISLIKE);
        }
    }.bind(this);

    this._handleClickShowInfo = function(e) {
        e.preventDefault();
        var movieId = this._detectMovieIdByEvent(e);
        var movie = this._findMovie(movieId);
        this.movieInfoModal.show(movie);
    }.bind(this);



    /**
     * Gets initial data with the all films and categories
     */
    this._fetchInitialData = function(callbacks) {
        this.apiHelper.getMovies().done(function(data) {
            console.log(data);

            for (var id in data.docMovies){
                if (data.docMovies.hasOwnProperty(id)) {
                    var film = data.docMovies[id]
                    if (film.booked) {
                        this.bookedMovies.push(film);
                    } else {
                        this.availableMovies.push(film);
                    }
                }
            }

            for (var id in data.medicineFields){
                if (data.medicineFields.hasOwnProperty(id)) {
                    this.medicineFields.push(data.medicineFields[id]);
                }
            }

            console.debug('Booked: ', this.bookedMovies.length);
            console.debug('Available: ', this.availableMovies.length);
            console.debug('Categories: ', this.medicineFields.length);

            callbacks.success();
        }.bind(this)).fail(function(e) {
            console.error("Can't fetch data:", e.statusText)
            callbacks.error(e.statusText);
        });
    }

    this._initPagination = function() {
        this.availableMoviesPagination = new PaginationController(
            $('.available-movies .movies-pagination'),
            18,
            function() { this._renderManageScreen() }.bind(this)
        );
    }

    this._renderManageScreen = function() {
        this._renderBookedMovies();
        this._renderAvailableMovies();

        this._showScreen('manage-movies-block');
    }

    
    this._renderBookedMovies = function() {
        $('.side-booked-videos-list').empty();
        $('.booked-movies-list-container').addClass('d-none');

        if (this.bookedMovies.length > 0) {
            this.bookedMovies.forEach(function(movie, index) {
                if (index == 0) {
                    this._renderLargeBookedMovieBlock(movie);
                } else {
                    this._renderSmallBookedMovieBlock(movie);
                }
            }.bind(this));

            this._showBookedMovieScreen('booked-movies-list');
        } else {
            this._showBookedMovieScreen('no-booked-movies-block');
        }
    }

    this._renderLargeBookedMovieBlock = function(movie) {
        var movieContainer = $('.large-booked-movie-container');
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
    }

    this._renderSmallBookedMovieBlock = function(movie) {
        $('.booked-movies-list-container').removeClass('d-none');

        var movieContainer = $($('.video-thumbnail-template').html());
        var jqThumbnailElem = movieContainer.find('.video-thumbnail');
        MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
        
        $('.booked-movies-list-container').find('.side-booked-videos-list').append(movieContainer);
    }

    this._showBookedMovieScreen = function(selector) {
        $('.booked-movie-screen').addClass('d-none');
        $(`.${selector}`).removeClass('d-none');
    }



    this._renderAvailableMovies = function() {
        var movies = this._getAvailableMovies();
        var jqRootMoviesContainer = $('.available-movies-list-container');
        jqRootMoviesContainer.find('.available-movie-container').remove();
        jqRootMoviesContainer.find('.no-available-movies-block').toggleClass('d-none', !!movies.length)
        var jqMovieContainerTemplate = $('.available-movies .video-thumbnail-template');
        movies.forEach(function(movie) {
            var jqMovieContainer = $(jqMovieContainerTemplate.html());
            var jqThumbnailElem = jqMovieContainer.find('.video-thumbnail');
            MovieThumbnailUtils.refreshThumbnailState(jqThumbnailElem, movie);
            jqRootMoviesContainer.append(jqMovieContainer);
        }.bind(this))
    }

    this._getAvailableMovies = function() {
        var movies = this._getFilteredAvailableMovies();
        return this._applyPagination(movies);
    }

    this._getFilteredAvailableMovies = function() {
        return this.searchBar.filter(this.availableMovies);
    }

    this._applyPagination = function(movies) {
        this.availableMoviesPagination.setup(movies.length);
        var startIndex = this.availableMoviesPagination.currentPage * this.availableMoviesPagination.itemsPerPage;
        return movies.slice(
            startIndex,
            startIndex + this.availableMoviesPagination.itemsPerPage
        );
    }


    this._setupSearchBar = function() {
        this.searchBar = new SearchBarController($('.search-block'), this.medicineFields, function() {
            this._renderAvailableMovies()
        }.bind(this))

        this.searchBar.init();
    }

    this._showError = function(errorMessage) {
        $('.error-block').find('.alert').text(errorMessage);
        this._showScreen('error-block');
    }

    this._showScreen = function(selector) {
        this._hideAllScreens();
        $(`.${selector}`).removeClass('d-none');
    }

    this._hideAllScreens = function() {
        $('.state-screen').addClass('d-none');
    }
}


/**
 * Manages pagination of available movies
 * 
 * @param {*} jqRootElement - the root pagination container
 * @param {*} itemsPerPage
 * @param {*} changePageCallback 
 */
function PaginationController(jqRootElement, itemsPerPage, changePageCallback) {
    this.jqRootElement = jqRootElement;
    this.jqFirstPage = this.jqRootElement.find('.first-page');
    this.jqPrevPage = this.jqRootElement.find('.prev-page');
    this.jqNextPage = this.jqRootElement.find('.next-page');
    this.jqLastPage = this.jqRootElement.find('.last-page');
    this.changePageCallback = changePageCallback || function(){};
    this.itemsPerPage = itemsPerPage || 9;
    this.currentPage = 0;
    this.countPages = 0;
    

    this._init = function() {
        this.jqFirstPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(0);
        }.bind(this));

        this.jqPrevPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.currentPage - 1);
        }.bind(this));

        this.jqNextPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.currentPage + 1);
        }.bind(this));

        this.jqLastPage.on('click', function(e) {
            e.preventDefault();
            this._changePage(this.countPages - 1);
        }.bind(this));
    }

    this._changePage = function(pageNumber) {
        if (pageNumber <= 0) {
            pageNumber = 0;
        } else if (pageNumber + 1 >= this.countPages) {
            pageNumber = this.countPages - 1;
        }

        if (this.currentPage != pageNumber) {
            this.currentPage = pageNumber;
            this.changePageCallback();
        }

        this._render();
    }

    this._init();


    this.setup = function(itemsCount) {
        itemsCount = itemsCount || 0;
        this.countPages = Math.ceil(itemsCount / this.itemsPerPage);
        
        if (this.countPages - 1 < this.currentPage) {
            this._changePage(0);
        } else {
            this._render();
        }
    }

    this._render = function() {
        this.jqRootElement.toggleClass('d-none', this.countPages === 0);
        this.jqRootElement.find('.current-page').text(this.currentPage + 1);
        this.jqRootElement.find('.max-pages').text(this.countPages);
        this.jqFirstPage.closest('.page-item').toggleClass('disabled', this.currentPage == 0);
        this.jqPrevPage.closest('.page-item').toggleClass('disabled', this.currentPage == 0);
        this.jqNextPage.closest('.page-item').toggleClass('disabled', this.currentPage >= this.countPages - 1);
        this.jqLastPage.closest('.page-item').toggleClass('disabled', this.currentPage >= this.countPages - 1);
    }
}


/**
 * Manages the search bar on films booking page
 * 
 * @param {*} jqRootElement 
 * @param {*} categories 
 * @param {*} onFilterChangeCallback 
 */
function SearchBarController(jqRootElement, categories, onFilterChangeCallback) {
    this.categoriesFilter = jqRootElement.find('select.categories-filter');
    this.showAllBtn = jqRootElement.find('.filter-btn-show-all');
    this.searchInput = jqRootElement.find('input[type=search]');
    this.searchBtn = jqRootElement.find('.btn-search');
    this.onFilterChangeCallback = onFilterChangeCallback || function() {}


    this.init = function() {
        this._setupCategories();
        this._setupShowAllBtn();
        this._setupTextSearch();
    }

    this._setupCategories = function() {

        categories.forEach(function(category) {
            this.categoriesFilter.append($('<option>', {
                value: category.id,
                text: category.name
            }));
        }.bind(this))
        
        this.categoriesFilter.selectpicker('refresh');

        this.categoriesFilter.on('change', function() {
            this.onFilterChangeCallback();
        }.bind(this));
    }

    this._setupShowAllBtn = function() {
        var showAllBtn = $('.filter-btn-show-all');
        showAllBtn.on('click', this._resetFilter);
    }

    this._resetFilter = function() {
        if (this.categoriesFilter) {
            this.categoriesFilter.selectpicker('val', '');
            this.searchInput.val('');
            this.onFilterChangeCallback();
        }
    }.bind(this);

    this._setupTextSearch = function() {
        this.searchInput.on("search", function(event) {
            this.searchBtn.trigger("click");
        }.bind(this));

        this.searchInput.on("keyup", function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                this.searchBtn.trigger("click");
            }
        }.bind(this));

        this.searchBtn.on('click', function(e) {
            e.preventDefault();
            this.onFilterChangeCallback();
        }.bind(this))
    }


    /**
     * Filters the movies based on the current filter settings
     * @param {*} movies 
     * @returns filtered movies array
     */
    this.filter = function(movies) {
        var categoryId = this.categoriesFilter.val();
        if (categoryId) {
            movies = movies.filter(function(movie) {
                return !!movie.medicineFields[categoryId]
            })
        }

        var searchText = this.searchInput.val().trim();
        if (searchText) {
            var searchExpression = new RegExp(searchText, 'gi')
            movies = movies.filter(function(movie) {
                return (movie.name && movie.name.match(searchExpression)) 
                        || (movie.description && movie.description.match(searchExpression))
            })
        }

        return movies
    }
}

/**
 * API helper simplifies the usage of the movies related api requests
 * 
 * @param {*} urls 
 */
function ApiHelper(urls) {

    this.getMovies = function() {
        return $.ajax({
            url: urls.movies,
            type: 'GET',
            cache: false
        })
    }

    /**
     * Posts a request to book or unbook the movie
     * @param {*} movieId 
     * @param {*} book 
     * @returns 
     */
    this.toggleBookMovie = function(movieId, book) {
        var formData = new FormData();
        formData.append('video-id', movieId);
        formData.append('selected', book);

        return $.ajax({
            url: urls.booking,
            type: 'POST',
            cache: false,
            processData: false,
            contentType: false,
            data: formData
        })
    }

    this.saveRating = function(movieId, rating) {
        var formData = new FormData();
        formData.append('video-id', movieId);
        formData.append('rating', rating);

        return $.ajax({
            url: urls.rating,
            type: 'POST',
            cache: false,
            processData: false,
            contentType: false,
            data: formData
        })
    }
}


/**
 * Utils for managing video thumbnails
 */
var MovieThumbnailUtils = MovieThumbnailUtils || {}

MovieThumbnailUtils.refreshThumbnailState = function(jqThumbnailElem, movie) {
    jqThumbnailElem.attr('data-video-src', movie.url);
    var posterImage = jqThumbnailElem.find('.poster-image');
    posterImage.attr(
        'src', 
        movie.thumbnail || MovieDefaults.POSTER_THUMBNAIL
    )
    posterImage.attr('alt', movie.name);
    jqThumbnailElem.find('.video-title').text(movie.name);
    jqThumbnailElem.attr('data-id', movie.id);
    jqThumbnailElem.find('.btn-like').toggleClass('active', movie.rating == MovieRating.LIKE);
    jqThumbnailElem.find('.btn-dislike').toggleClass('active', movie.rating == MovieRating.DISLIKE);

    jqThumbnailElem.find('.btn-book').toggleClass('d-none', movie.booked)
    jqThumbnailElem.find('.btn-unbook').toggleClass('d-none', !movie.booked)
}


/**
 * Used for managing the movies info modal
 * 
 * @param {string} modalId 
 */
function MovieInformationModal(modalId) {
    this._modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById(modalId))

    this.show = function(movie) {
        this.hide();
        var jqModalElem = $(`#${modalId}`);
        var thumbnailElem = jqModalElem.find(".video-thumbnail");
        MovieThumbnailUtils.refreshThumbnailState(thumbnailElem, movie);
        jqModalElem.find('.video-description').text(movie.description);

        this._modalInstance.show();
    }

    this.hide = function() {
        this._modalInstance.hide();
    }
}