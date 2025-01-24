/*
	Earth Terminator Display
	Created by Stuart Lowe
	Maintainer Edward Gomez @zemogle
	(C) Las Cumbres Observatory 2015


*/
function WorldMap(conf) {

	this.clock = new Date();
	this.d2r = Math.PI/180;
	this.r2d = 180/Math.PI;
	this.day = document.getElementById("day");
	this.night = document.getElementById("night");

	this.id = "map";
	this.placemarks = (typeof conf.placemarks=="object") ? conf.placemarks : new Array();
	this.fs = 11;
	this.sigma = 6;
	this.dt = 0;
	this.counter = 0;
	this.updaten = 50;
	this.shadowradius = 8006044.77150472;

	if(typeof conf=="object"){
		if(typeof conf.id=="string") this.id = conf.id;
		if(typeof conf.fontSize=="number") this.fs = conf.fontSize;
		if(typeof conf.dt=="number") this.dt = conf.dt;
		if(typeof conf.updaten=="number") this.updaten = conf.updaten;
	}

	// Get the sprite images
	this.galaxy = document.getElementById("galaxy");
	this.nebula = document.getElementById("nebula");
	this.cluster = document.getElementById("cluster");

	//this.ie = (navigator.userAgent.match(/MSIE ([\d.]+)?/)) ? +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1] : false;
	this.ie = false;
	this.excanvas = (typeof G_vmlCanvasManager != 'undefined') ? true : false;
	/*@cc_on
	var ua = navigator.userAgent;
	var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	re.exec(ua);
	var v = parseFloat(RegExp.$1);
	//if(v < 9) this.excanvas = true;
	this.ie = true
	@*/
	// Construct the map
	this.createMap();

	return this;
}
WorldMap.prototype.createMap = function(){
	var el = document.getElementById(this.id);

	// If the Javascript function has been passed a width/height
	// those take precedence over the CSS-set values
	if(typeof jQuery != 'undefined'){
		if(this.width > 0) $('#'+this.id).width(this.width);
		if(this.height > 0) $('#'+this.id).height(this.height);
		this.width = $('#'+this.id).width();
		this.height = $('#'+this.id).height();
	}
	if(el!=null){
		if(typeof el=="object" && el.tagName != "CANVAS"){
			// Looks like the element is a container for our <canvas>
			el.setAttribute('id',this.id+'holder');
			this.width = (el.offsetWidth) ? ''+parseInt(el.offsetWidth) : this.width;
			this.height = (el.offsetHeight) ? ''+parseInt(el.offsetHeight) : this.height;
			elcanvas = document.createElement('canvas');
			elcanvas.style.display='block';
			elcanvas.setAttribute('width',this.width);
			elcanvas.setAttribute('height',this.height);
			elcanvas.setAttribute('id',this.id);
			el.appendChild(elcanvas);
			// Fix for IE9 Standards mode as .setAttribute('height') doesn't seems to attach to <canvas>
			if(this.ie && typeof jQuery != 'undefined' && !this.excanvas) $('#'+this.id).css('height',this.height);
			// For excanvas we need to initialise the newly created <canvas>
			if(this.excanvas) el = G_vmlCanvasManager.initElement(elcanvas);
		}else{
			// Define the size of the canvas
			this.width = el.getAttribute('width');
			this.height = el.getAttribute('height');
			// Excanvas doesn't seem to attach itself to the existing
			// <canvas> so we make a new one and replace it.
			if(/*@cc_on!@*/false){
				elcanvas = document.createElement('canvas');
				elcanvas.style.display='block';
				elcanvas.setAttribute('width',this.width);
				elcanvas.setAttribute('height',this.height);
				elcanvas.setAttribute('id',this.id);
				el.parentNode.replaceChild(elcanvas,el);
				// Fix for IE9 Standards mode as .setAttribute('height') doesn't seem to attach to <canvas>
				if(this.ie && typeof jQuery != 'undefined' && !this.excanvas) $('#'+this.id).css('height',this.height);
				if(this.excanvas) el = G_vmlCanvasManager.initElement(elcanvas);
			}
		}
	}else{
		// No appropriate ID or <canvas> exists. So we'll make one.
		elcanvas = document.createElement('canvas');
		elcanvas.style.display='block';
		elcanvas.setAttribute('width',this.width);
		elcanvas.setAttribute('height',this.height);
		elcanvas.setAttribute('id',this.id);
		document.body.appendChild(elcanvas);
		el = elcanvas;
		// Fix for IE9 Standards mode as .setAttribute('height') doesn't seem to attach to <canvas>
		if(this.ie && typeof jQuery != 'undefined' && !this.excanvas) $('#'+this.id).css('height',this.height);
		// For excanvas we need to initialise the newly created <canvas>
		if(this.excanvas) G_vmlCanvasManager.initElement(elcanvas);
	}

	// Now set up the canvas
	this.canvas = document.getElementById(this.id);
	if(this.canvas && this.canvas.getContext){
		this.ctx = this.canvas.getContext('2d');
		this.wide = this.canvas.getAttribute("width");
		this.tall = this.canvas.getAttribute("height");
		this.fs = Math.max(11,Math.round(this.tall/40));
		this.ctx.clearRect(0,0,this.wide,this.tall);
		this.ctx.beginPath();
		this.ctx.font = this.fs+"px Helvetica";
		this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.lineWidth = 1.5;
		var loading = 'Loading sky...';
		this.ctx.fillText(loading,(this.width-this.ctx.measureText(loading).width)/2,(this.tall-this.fs)/2)
		this.ctx.fill();
	}

	// Get the position of the Sun
	this.sun = this.getSunPosition();


	this.d2x = this.wide/360;
	this.d2y = this.tall/180;

	// Draw HTML labels - these won't change so only draw them this once
	var off = jQuery('#'+this.id).offset();
	this.d = 5;

	for(var i = 0; i < this.placemarks.length ; i++){
		p = this.placemarks[i];
		d2x =this.wide/365 ; // Tuned for non-mercator stretch map
		if(!p.x){
			p.x = (p.lon+180)*d2x;
      if (p.lat < 0){
        // Tuned for non-mercator stretch map
        d2y = this.tall/220;
      } else {
        d2y = this.tall/190;
      }
			p.y = (this.tall-(p.lat+90)*d2y);
		}
		this.ctx.fillRect(p.x-this.d/2,p.y-this.d/2,this.d,this.d);
		align = (typeof p.align=="string" && p.align=="left") ? "left" : "right";
		if(align=="right"){
			w = Math.floor(this.wide-p.x);
			if(w > this.fs*p.label.length) w = this.fs*p.label.length;
		}else{
			w = Math.floor(p.x);
			if(w > this.fs*p.label.length) w = this.fs*p.label.length;
		}
		label = ((p.link) ? '<a href="'+p.link+'" target="_parent" style="color:white;text-decoration:none;text-shadow: 0px 0px 4px #000;font-size:'+this.fs+'px;padding:'+((align=="left") ? '0px '+(this.d*1.5)+'px 0px 0px' : '0px 0px 0px '+(this.d*1.5)+'px')+';">' : '')+p.label+((p.link) ? '</a>' : '');
		jQuery('body').append('<div class="worldmap_label" style="position:absolute;top:'+(off.top+p.y-(this.fs/2))+'px;left:'+((align=="left") ? off.left+p.x+this.d/2-w: off.left+p.x-this.d/2)+'px;text-align:'+((align=="left") ? "right" : "left")+';width:'+w+'px;height:'+(this.fs)+'px;display:block;font-size:'+this.fs+'px;'+((p.link) ? '' : 'padding:0px 0px 0px '+(this.d*1.5)+'px;')+';z-index:20;">'+label+'</div>');

	}

	// Credit line
	var credit = 'Powered by Las Cumbres Observatory';
	// Float a transparent link on top of the credit text
	if(typeof jQuery != 'undefined') {
		if($('#'+this.id+'_credit').length == 0){
			jQuery('body').append('<div id="'+this.id+'_credit" style="position:absolute;padding:0px;top:'+(off.top+parseInt(this.tall)-5-11)+';left:'+(off.left+5)+';z-index:20;"><a href="https://lco.global" style="margin:4px;font-size:11px;text-shadow: 0px 0px 4px '+((this.sun.dec < 0) ? 'white':'black')+';color:'+((this.sun.dec < 0) ? 'black':'white')+';text-decoration:none;" title="Created by the Las Cumbres Observatory Global Telescope">'+credit+'</a></div>');
		}
		jQuery('body').append('<div id="'+this.id+'_framerate" style="position:absolute;padding:0px;bottom:5px;right:5px;z-index:20;font-size:12px;"></div>');
	}

	buffer = document.createElement('canvas');
	// buffer.style.display='block';
	buffer.setAttribute('width',this.wide);
	buffer.setAttribute('height',this.tall);
	buffer.setAttribute('id','buffer');
	document.body.appendChild(buffer);
	// Fix for IE9 Standards mode as .setAttribute('height') doesn't seems to attach to <canvas>
	if(this.ie && typeof jQuery != 'undefined' && !this.excanvas) $('#buffer').css('height',this.tall);
	// For excanvas we need to initialise the newly created <canvas>
	if(this.excanvas) buffer = G_vmlCanvasManager.initElement(buffer);
	bx = buffer.getContext('2d');

	if(!this.excanvas){
		bx.drawImage(this.day, 0, 0, this.wide, this.tall);
		this.dayImg = bx.getImageData(0, 0, this.wide, this.tall);
		this.dayData = this.dayImg.data;
		bx.drawImage(this.night, 0, 0, this.wide, this.tall);
		this.nightImg = bx.getImageData(0, 0, this.wide, this.tall);
		this.nightData = this.nightImg.data;
	}else{
		// For excanvas we need to initialise the newly created <canvas>
		G_vmlCanvasManager.initElement(buffer);
	}
//	if(typeof jQuery != 'undefined') jQuery('#buffer').hide().css('display','none');

	this.draw();
}
WorldMap.prototype.update = function(newdate){
	if(newdate) this.clock = new Date(newdate);
	else if(this.dt > 0) this.clock = new Date(this.clock.getTime()+this.dt);
	else this.clock = new Date();
	this.sun = this.getSunPosition();
	this.draw();
}
WorldMap.prototype.getJD = function() {
	// The Julian Date of the Unix Time epoch is 2440587.5
	today = this.clock;
	return ( today.getTime() / 86400000.0 ) + 2440587.5;
}
// Uses algorithm defined in Practical Astronomy (4th ed) by Peter Duffet-Smith and Jonathan Zwart
WorldMap.prototype.sunPos = function(JD){
	if(typeof JD!="number") JD = this.getJD()
	D = (JD-2455196.5);	// Number of days since the epoch of 2010 January 0.0
	// Calculated for epoch 2010.0. If T is the number of Julian centuries since 1900 January 0.5 = (JD-2415020.0)/36525
	eg = 279.557208;	// mean ecliptic longitude in degrees = (279.6966778 + 36000.76892*T + 0.0003025*T*T)%360;
	wg = 283.112438;	// longitude of the Sun at perigee in degrees = 281.2208444 + 1.719175*T + 0.000452778*T*T;
	e = 0.016705;	// eccentricity of the Sun-Earth orbit in degrees = 0.01675104 - 0.0000418*T - 0.000000126*T*T;
	N = ((360/365.242191)*D)%360;
	if(N < 0) N += 360;
	Mo = (N + eg - wg)%360	// mean anomaly in degrees
	if(Mo < 0) Mo += 360;
	v = Mo + (360/Math.PI)*e*Math.sin(Mo*this.d2r);
	lon = v + wg;
	if(lon > 360) lon -= 360;
	lat = 0;
	T = D/(100*365.25);
	obliquity = 23+(26/60)+(21.45/3600) - (46.815/3600)*T - (0.0006/3600)*T*T + (0.00181/3600)*T*T*T;
	sobl = Math.sin(obliquity*this.d2r);
	slon = Math.sin(lon*this.d2r);
	ra = Math.atan2(slon*sobl,Math.cos(lon*this.d2r));
	dec = Math.asin(sobl*slon);
	return {lat:lat,lon:lon,Mo:Mo,D:D,N:N,v:v,ra:ra,dec:dec};
}

WorldMap.prototype.jday = function(date) {
	return (date.getTime() / 86400000.0) + 2440587.5;
}

WorldMap.prototype.getSunPosition = function(date) {
	date = (date instanceof Date) ? date : new Date();

	var rad = 0.017453292519943295;

	// based on NOAA solar calculations
	var ms_past_midnight = ((date.getUTCHours() * 60 + date.getUTCMinutes()) * 60 + date.getUTCSeconds()) * 1000 + date.getUTCMilliseconds();
	var jc = (this.jday(date) - 2451545)/36525;
	var mean_long_sun = (280.46646+jc*(36000.76983+jc*0.0003032)) % 360;
	var mean_anom_sun = 357.52911+jc*(35999.05029-0.0001537*jc);
	var sun_eq = Math.sin(rad*mean_anom_sun)*(1.914602-jc*(0.004817+0.000014*jc))+Math.sin(rad*2*mean_anom_sun)*(0.019993-0.000101*jc)+Math.sin(rad*3*mean_anom_sun)*0.000289;
	var sun_true_long = mean_long_sun + sun_eq;
	var sun_app_long = sun_true_long - 0.00569 - 0.00478*Math.sin(rad*125.04-1934.136*jc);
	var mean_obliq_ecliptic = 23+(26+((21.448-jc*(46.815+jc*(0.00059-jc*0.001813))))/60)/60;
	var obliq_corr = mean_obliq_ecliptic + 0.00256*Math.cos(rad*125.04-1934.136*jc);

	var lat = Math.asin(Math.sin(rad*obliq_corr)*Math.sin(rad*sun_app_long)) / rad;

	var eccent = 0.016708634-jc*(0.000042037+0.0000001267*jc);
	var y = Math.tan(rad*(obliq_corr/2))*Math.tan(rad*(obliq_corr/2));
	var rq_of_time = 4*((y*Math.sin(2*rad*mean_long_sun)-2*eccent*Math.sin(rad*mean_anom_sun)+4*eccent*y*Math.sin(rad*mean_anom_sun)*Math.cos(2*rad*mean_long_sun)-0.5*y*y*Math.sin(4*rad*mean_long_sun)-1.25*eccent*eccent*Math.sin(2*rad*mean_anom_sun))/rad);
	var true_solar_time_in_deg = ((ms_past_midnight+rq_of_time*60000) % 86400000) / 240000;

	var lng = -((true_solar_time_in_deg < 0) ? true_solar_time_in_deg + 180 : true_solar_time_in_deg - 180);

	obliquity = 23+(26/60)+(21.45/3600) - (46.815/3600)*jc - (0.0006/3600)*jc*jc + (0.00181/3600)*jc*jc*jc;
	sobl = Math.sin(obliquity*this.d2r);
	slon = Math.sin(lng*this.d2r);
	ra = Math.atan2(slon*sobl,Math.cos(lng*this.d2r));
	dec = Math.asin(sobl*slon);

	return {lat: lat, lon: lng,ra:ra,dec:dec};
}

WorldMap.prototype.getShadowRadiusFromAngle = function(angle) {
	var shadow_radius =  6371008 * Math.PI * 0.5;
	var twilight_dist = ((6371008 * 2 * Math.PI) / 360) * angle;
	return shadow_radius - twilight_dist;
}

WorldMap.prototype.getShadowPosition = function() {
	return (this.sun) ? {lat:-this.sun.lat, lon:this.sun.lon + 180} : null;
}

WorldMap.prototype.draw = function(markers) {
	if(this.canvas && this.canvas.getContext){
		clock = new Date();
		ha = 360*((this.clock.getUTCHours()+(this.clock.getMinutes()/60)+(this.clock.getSeconds()/3600))-12)/24

		//console.log("Time until star drawing:" + (new Date() - this.clock) + "ms");

		dlon = 2;
		var x = new Array();
		var y = new Array();

		// Jump 2 degrees in longitude
		for(var lon = -180 ; lon <= 180; lon += 2){
			tlat = Math.atan2(-Math.cos((lon+ha)*this.d2r),Math.tan(this.sun.dec))*this.r2d;
			if(tlat < -90) tlat += 180
			if(tlat > 90) tlat -= 180
			x.push((lon+180)*this.d2x);
			y.push(this.tall-(tlat+90)*this.d2y);	// y is inverted
		}

		//console.log("Calculated terminator points:" + (new Date() - this.clock) + "ms");

		if(this.sun.dec < 0){
			x.push(this.wide);
			y.push(this.tall);
			x.push(0);
			y.push(this.tall);
		}else if(this.sun.dec > 0){
			x.push(this.wide);
			y.push(0);
			x.push(0);
			y.push(0);
		}

		if(!this.excanvas){

			this.ctx.shadowBlur = 0;
			buffer = document.getElementById('buffer');
			bx = buffer.getContext('2d');

			bx.fillStyle = "white";
			bx.fillRect(0,0,this.wide,this.tall);
			bx.beginPath();
			bx.fillStyle = "black";
			// Different bounding boxes depending on season
			if(this.sun.dec < 0){
				bx.moveTo(0,0);
				bx.lineTo(0,this.tall);
				bx.lineTo(this.wide,this.tall);
				bx.lineTo(this.wide,0);
				bx.lineTo(0,0);
			}else{
				bx.moveTo(this.wide,0);
				bx.lineTo(this.wide,this.tall);
				bx.lineTo(0,this.tall);
				bx.lineTo(0,0);
				bx.lineTo(this.wide,0);
			}
			for(var i = 0; i < x.length ; i++){
				if(i == 0) bx.moveTo(x[i], y[i]);
				else bx.lineTo(x[i], y[i]);
			}
			bx.fill();
			bx.closePath();
			//console.log("Drawn terminator:" + (new Date() - this.clock) + "ms");

			var npix = this.wide*this.tall;

			var image = bx.getImageData(0, 0, this.wide, this.tall);
			var imageData = image.data; // here we detach the pixels array from DOM
			var image2 = bx.getImageData(0, 0, this.wide, this.tall);
			var image2Data = image2.data; // here we detach the pixels array from DOM
			var sigmashort = this.sigma/Math.sqrt(2);
			var sigma2 = this.sigma*2;
			//console.log("Read terminator:" + (new Date() - this.clock) + "ms");

			var changed = new Array();
			// Find places where it changes
			for(var i = 1, j = 0 ; i < npix ; i++, j+=4){
				if(imageData[j]-imageData[j-4] != 0){
					ty = Math.floor(i/this.wide)
					tx = i % this.wide
					changed.push({x:tx,y:ty})
				}
			}
			//console.log("Calculated terminator pixels:" + (new Date() - this.clock) + "ms");

//			for(var i = 1, j = 0 ; i < npix ; i++, j+=4){
//				imageData[i] = imageData[i]*imageData[i];
//			}
			//console.log("multiply loop:" + (new Date() - this.clock) + "ms");


			this.wide = Math.ceil(this.wide);
			processed = new Array(npix);
			for(var c = 0, cl = changed.length; c < cl ; c++){
				var py = changed[c].y-this.sigma
				if(py < 0 || py > this.tall) continue;
				for(var pywide = py*this.wide; py < changed[c].y+this.sigma ; py++,pywide+=this.wide){
					if(py < 0 || py > this.tall) continue;
					bigy = (Math.abs(py-changed[c].y) > sigmashort) ? true : false;
					for(var px = changed[c].x-this.sigma ; px < changed[c].x+this.sigma ; px++){
						if(px < 0 || px > this.wide) continue;
						pixel = px + pywide;
						if(processed[pixel]) continue;
						if(Math.abs(px-changed[c].x) > sigmashort && bigy) continue;
						for(var dy = -this.sigma, dy2 = -this.sigma*this.wide, tot=0,n=0; dy <= this.sigma ; dy+=2, dy2 += 2*this.wide){
							for(var dx = -this.sigma; dx <= this.sigma ; dx+=2){
								pix = pixel + dx + dy2;
								if(pix < 0 || pix > npix) continue;
								tot += imageData[4*pix];
								n++;
							}
						}
						image2Data[4*pixel] = tot/n;
						processed[pixel] = true;
					}
				}
			}
			image2.data = image2Data;


			//console.log("Blurred terminator:" + (new Date() - this.clock) + "ms");

			// Get another copy of the canvas
			var composite = bx.getImageData(0, 0, this.wide, this.tall);
			var compositeData = composite.data;

			fournpix = npix*4;
			for(var j = 0 ; j < fournpix ; j+=4){
				f = image2Data[j]/255
				mf = 1-f;
				compositeData[j] = this.nightData[j]*mf + this.dayData[j+0]*f;
				compositeData[j+1] = this.nightData[j+1]*mf + this.dayData[j+1]*f;
				compositeData[j+2] = this.nightData[j+2]*mf + this.dayData[j+2]*f;
			}
			composite.data = compositeData;
			this.ctx.putImageData(composite, 0, 0);

			//console.log("Drawn blurred terminator:" + (new Date() - this.clock) + "ms");

		}else{

			// Draw day
			this.ctx.drawImage(this.day, 0, 0, this.wide, this.tall);
			this.ctx.fillStyle = "rgba(0,0,0,0.7)";
			this.ctx.beginPath();
			this.ctx.moveTo(0,0);
			this.ctx.lineTo(0,this.tall);
			this.ctx.lineTo(this.wide,this.tall);
			this.ctx.lineTo(this.wide,0);
			this.ctx.lineTo(0,0);
			for(var i = 0; i < x.length ; i++){
				if(i == 0) this.ctx.moveTo(x[i], y[i]);
				else this.ctx.lineTo(x[i], y[i]);
			}
			this.ctx.fill();
		}

		// Draw markers
		// this.ctx.beginPath();
		// if(!this.excanvas){
		// 	this.ctx.shadowOffsetX = 0;
		// 	this.ctx.shadowOffsetY = 0;
		// 	this.ctx.shadowBlur    = 5;
		// 	this.ctx.shadowColor   = 'rgba(0, 0, 0, 1)';
		// }
		// this.ctx.fillStyle = "rgb(255,255,255)";
		// for(var i = 0; i < this.placemarks.length ; i++){
		// 	p = this.placemarks[i];
		// 	if(!p.x){
		// 		p.x = (p.lon+180)*this.d2x;
		// 		p.y = (this.tall-(p.lat+90)*this.d2y);
		// 	}
		// 	this.ctx.fillRect(p.x-this.d/2,p.y-this.d/2,this.d,this.d);
		// }
		// this.ctx.restore();

		this.ctx.beginPath();
		if(!this.excanvas){
			this.ctx.shadowOffsetX = 0;
			this.ctx.shadowOffsetY = 0;
			this.ctx.shadowBlur    = 5;
			this.ctx.shadowColor   = 'rgba(0, 0, 0, 1)';
		}
		this.ctx.fillStyle = "rgb(255,255,255)";
		for(var i = 0; i < this.placemarks.length ; i++){
			p = this.placemarks[i];
			if(!p.x){
				p.x = (p.lon+180)*this.d2x;
				p.y = (this.tall-(p.lat+90)*this.d2y);
			}
			this.ctx.fillRect(p.x-this.d/2,p.y-this.d/2,this.d,this.d);
		}
		this.ctx.restore();
		//jQuery("#"+this.id+"_framerate").html((new Date() - clock) + "ms");
		// console.log("Total time:" + (new Date() - this.clock) + "ms");
		
		// Draw astronomical objects
		if (markers){
			let celestialIcon;
			for (const marker of markers){
				console.log(marker.type)
				lon = getLongitudeWhereObjectOverhead(marker.ra, this.clock);
				marker.x = (lon+180)*this.d2x;
				marker.y = (this.tall-(marker.dec+90)*this.d2y);
				switch(marker.type){
					case 'galaxy':
						celestialIcon = this.galaxy;
						break;
					case 'nebula':
						celestialIcon = this.nebula;
						break;
					case 'cluster':
						celestialIcon = this.cluster;
						break;
				}
				this.ctx.drawImage(celestialIcon, marker.x, marker.y, 30, 30);
				console.log("Drawing object at " + marker.x + ", " + marker.y);
			}
		}
	}
}
