/*
 * KMLLoader.js Copyright (C) 2012 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Moisés Arcos Santiago (mailto:marcos@emergya.com)
 */
/**
 * api: (define) module = PersistenceGeo
 */
Ext.namespace("PersistenceGeo.loaders");

/**
 * api: (define) module = PersistenceGeo.loaders class = KMLLoader
 */
Ext.namespace("PersistenceGeo.loaders.KMLLoader");

/**
 * Class: PersistenceGeoParser.KMLLoader
 * 
 * Loader for KML Layers
 * 
 */
PersistenceGeo.loaders.KMLLoader 
	= Ext.extend(PersistenceGeo.loaders.AbstractLoader,{

		/*
		 * Method: formatType
		 * 
		 * Type format of the layer to Load (KML)
		 */
		formatType : function(externalProjection) {
			var targetProj = this.map.projection;
			if(!!externalProjection){
				targetProj = externalProjection;
			}
			return new OpenLayers.Format.KML({
				internalProjection : new OpenLayers.Projection(this.map.projection),
				externalProjection : new OpenLayers.Projection(targetProj),
				extractStyles : true,
				extractAttributes : true,
				maxDepth : 2
			});
		},

		/**
		 * Method to be called for generate OpenLayers layer
		 * 
		 * @return OpenLayers.Layer
		 */
		load : function(layerData, layerTree) {
			// Get layer style
			var styleMap = this.preFunctionStyle(layerData);
			
			var layer = new OpenLayers.Layer.Vector(layerData.name, {
				strategies : [ new OpenLayers.Strategy.Fixed() ],
				styleMap: styleMap,
				protocol : new OpenLayers.Protocol.HTTP({
					url : layerData.server_resource.replace(this.defaultRestBaseUrl, this.restBaseUrl),
					format : this.formatType(layerData.properties ? layerData.properties.externalProjection : null),
					srsName : this.map.projection
				})
			});

			this.postFunctionsWrapper(layerData, layer, layerTree);

			return layer;
		}
});