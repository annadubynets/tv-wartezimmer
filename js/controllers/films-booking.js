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

function FilmsBookingController(options) {
    this.api = options.api || {};
    this.bookedMovies = [];
    this.availableMovies = [];
    this.medicineFields = [];

    this.defaultPosterImage = 'images/video.png';

    this.init = function() {
        this._fetchInitialData({
            success: function() { this._renderInitialScreen() }.bind(this),
            error: function(error) { this._showError(error) }.bind(this)
        });
    }

    /**
     * Gets initial data with the all films and categories
     */
    this._fetchInitialData = function(callbacks) {
        $.get(this.api.movies, function(data) {
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

    this._renderInitialScreen = function() {
        this._renderBookedMovies();
        this._renderAvailableMovies();


        this._showScreen('manage-movies-block');
    }



    this._renderBookedMovies = function() {
        $('.side-booked-videos-list').empty();
        $('.booked-films-list-container').addClass('d-none');

        if (this.bookedMovies.length > 0) {
            this.bookedMovies.forEach(function(movie, index) {
                if (index == 0) {
                    this._renderLargeMovieBlock(movie);
                } else {
                    this._renderSmallMovieBlock(movie);
                }
            }.bind(this));

            this._showBookedMovieScreen('booked-films-list');
        } else {
            this._showBookedMovieScreen('no-booked-films-block');
        }
    }

    this._renderLargeMovieBlock = function(movie) {
        var movieContainer = $('.large-booked-movie-container');
        var thumbnail = movieContainer.find('.video-thumbnail');
        thumbnail.attr('data-video-src', movie.url);
        var posterImage = thumbnail.find('.poster-image');
        posterImage.attr(
            'src', 
            movie.thumbnails.length > 0 ? movie.thumbnails[movie.thumbnails.length-1] : this.defaultPosterImage
        )
        posterImage.attr('alt', movie.name);
        thumbnail.find('.video-title').text(movie.name);
        thumbnail.attr('id', movie.id);
    }

    this._renderSmallMovieBlock = function(movie) {
        $('.booked-films-list-container').removeClass('d-none');

        var movieContainer = $($('.video-thumbnail-template').html());
        var thumbnail = movieContainer.find('.video-thumbnail');
        thumbnail.attr('data-video-src', movie.url);
        var posterImage = thumbnail.find('.poster-image');
        posterImage.attr(
            'src', 
            movie.thumbnails.length > 0 ? movie.thumbnails[movie.thumbnails.length-1] : this.defaultPosterImage
        )
        posterImage.attr('alt', movie.name);
        thumbnail.find('.video-title').text(movie.name);
        thumbnail.attr('id', movie.id);

        $('.booked-films-list-container').find('.side-booked-videos-list').append(movieContainer);
    }

    this._showBookedMovieScreen = function(selector) {
        $('.booked-movie-screen').addClass('d-none');
        $(`.${selector}`).removeClass('d-none');

        
    }



    this._renderAvailableMovies = function() {
        //this.bookedMovies.forEach()
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