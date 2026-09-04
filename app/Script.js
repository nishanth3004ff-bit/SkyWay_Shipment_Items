/* ======================================================================
   THREE.OrbitControls (r128 addon) — bundled here because it isn't part
   of the three.min.js core CDN bundle loaded in dashboard.html.
   ====================================================================== */
( function () {

	const _changeEvent = {
		type: 'change'
	};
	const _startEvent = {
		type: 'start'
	};
	const _endEvent = {
		type: 'end'
	};

	class OrbitControls extends THREE.EventDispatcher {

		constructor( object, domElement ) {

			super();
			if ( domElement === undefined ) console.warn( 'THREE.OrbitControls: The second parameter "domElement" is now mandatory.' );
			if ( domElement === document ) console.error( 'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );
			this.object = object;
			this.domElement = domElement;

			this.enabled = true;

			this.target = new THREE.Vector3();

			this.minDistance = 0;
			this.maxDistance = Infinity;

			this.minZoom = 0;
			this.maxZoom = Infinity;

			this.minPolarAngle = 0;

			this.maxPolarAngle = Math.PI;

			this.minAzimuthAngle = - Infinity;

			this.maxAzimuthAngle = Infinity;

			this.enableDamping = false;
			this.dampingFactor = 0.05;

			this.enableZoom = true;
			this.zoomSpeed = 1.0;

			this.enableRotate = true;
			this.rotateSpeed = 1.0;

			this.enablePan = true;
			this.panSpeed = 1.0;
			this.screenSpacePanning = true;

			this.keyPanSpeed = 7.0;

			this.autoRotate = false;
			this.autoRotateSpeed = 2.0;

			this.keys = {
				LEFT: 'ArrowLeft',
				UP: 'ArrowUp',
				RIGHT: 'ArrowRight',
				BOTTOM: 'ArrowDown'
			};

			this.mouseButtons = {
				LEFT: THREE.MOUSE.ROTATE,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.PAN
			};

			this.touches = {
				ONE: THREE.TOUCH.ROTATE,
				TWO: THREE.TOUCH.DOLLY_PAN
			};

			this.target0 = this.target.clone();
			this.position0 = this.object.position.clone();
			this.zoom0 = this.object.zoom;

			this._domElementKeyEvents = null;

			this.getPolarAngle = function () {

				return spherical.phi;

			};

			this.getAzimuthalAngle = function () {

				return spherical.theta;

			};

			this.listenToKeyEvents = function ( domElement ) {

				domElement.addEventListener( 'keydown', onKeyDown );
				this._domElementKeyEvents = domElement;

			};

			this.saveState = function () {

				scope.target0.copy( scope.target );
				scope.position0.copy( scope.object.position );
				scope.zoom0 = scope.object.zoom;

			};

			this.reset = function () {

				scope.target.copy( scope.target0 );
				scope.object.position.copy( scope.position0 );
				scope.object.zoom = scope.zoom0;
				scope.object.updateProjectionMatrix();
				scope.dispatchEvent( _changeEvent );
				scope.update();
				state = STATE.NONE;

			};


			this.update = function () {

				const offset = new THREE.Vector3();

				const quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
				const quatInverse = quat.clone().invert();
				const lastPosition = new THREE.Vector3();
				const lastQuaternion = new THREE.Quaternion();
				const twoPI = 2 * Math.PI;
				return function update() {

					const position = scope.object.position;
					offset.copy( position ).sub( scope.target );

					offset.applyQuaternion( quat );

					spherical.setFromVector3( offset );

					if ( scope.autoRotate && state === STATE.NONE ) {

						rotateLeft( getAutoRotationAngle() );

					}

					if ( scope.enableDamping ) {

						spherical.theta += sphericalDelta.theta * scope.dampingFactor;
						spherical.phi += sphericalDelta.phi * scope.dampingFactor;

					} else {

						spherical.theta += sphericalDelta.theta;
						spherical.phi += sphericalDelta.phi;

					}


					let min = scope.minAzimuthAngle;
					let max = scope.maxAzimuthAngle;

					if ( isFinite( min ) && isFinite( max ) ) {

						if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;
						if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

						if ( min <= max ) {

							spherical.theta = Math.max( min, Math.min( max, spherical.theta ) );

						} else {

							spherical.theta = spherical.theta > ( min + max ) / 2 ? Math.max( min, spherical.theta ) : Math.min( max, spherical.theta );

						}

					}


					spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
					spherical.makeSafe();
					spherical.radius *= scale;

					spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

					if ( scope.enableDamping === true ) {

						scope.target.addScaledVector( panOffset, scope.dampingFactor );

					} else {

						scope.target.add( panOffset );

					}

					offset.setFromSpherical( spherical );

					offset.applyQuaternion( quatInverse );
					position.copy( scope.target ).add( offset );
					scope.object.lookAt( scope.target );

					if ( scope.enableDamping === true ) {

						sphericalDelta.theta *= 1 - scope.dampingFactor;
						sphericalDelta.phi *= 1 - scope.dampingFactor;
						panOffset.multiplyScalar( 1 - scope.dampingFactor );

					} else {

						sphericalDelta.set( 0, 0, 0 );
						panOffset.set( 0, 0, 0 );

					}

					scale = 1;

					if ( zoomChanged || lastPosition.distanceToSquared( scope.object.position ) > EPS || 8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

						scope.dispatchEvent( _changeEvent );
						lastPosition.copy( scope.object.position );
						lastQuaternion.copy( scope.object.quaternion );
						zoomChanged = false;
						return true;

					}

					return false;

				};

			}();

			this.dispose = function () {

				scope.domElement.removeEventListener( 'contextmenu', onContextMenu );
				scope.domElement.removeEventListener( 'pointerdown', onPointerDown );
				scope.domElement.removeEventListener( 'wheel', onMouseWheel );
				scope.domElement.removeEventListener( 'touchstart', onTouchStart );
				scope.domElement.removeEventListener( 'touchend', onTouchEnd );
				scope.domElement.removeEventListener( 'touchmove', onTouchMove );
				scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove );
				scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp );

				if ( scope._domElementKeyEvents !== null ) {

					scope._domElementKeyEvents.removeEventListener( 'keydown', onKeyDown );

				}

			};


			const scope = this;
			const STATE = {
				NONE: - 1,
				ROTATE: 0,
				DOLLY: 1,
				PAN: 2,
				TOUCH_ROTATE: 3,
				TOUCH_PAN: 4,
				TOUCH_DOLLY_PAN: 5,
				TOUCH_DOLLY_ROTATE: 6
			};
			let state = STATE.NONE;
			const EPS = 0.000001;

			const spherical = new THREE.Spherical();
			const sphericalDelta = new THREE.Spherical();
			let scale = 1;
			const panOffset = new THREE.Vector3();
			let zoomChanged = false;
			const rotateStart = new THREE.Vector2();
			const rotateEnd = new THREE.Vector2();
			const rotateDelta = new THREE.Vector2();
			const panStart = new THREE.Vector2();
			const panEnd = new THREE.Vector2();
			const panDelta = new THREE.Vector2();
			const dollyStart = new THREE.Vector2();
			const dollyEnd = new THREE.Vector2();
			const dollyDelta = new THREE.Vector2();

			function getAutoRotationAngle() {

				return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

			}

			function getZoomScale() {

				return Math.pow( 0.95, scope.zoomSpeed );

			}

			function rotateLeft( angle ) {

				sphericalDelta.theta -= angle;

			}

			function rotateUp( angle ) {

				sphericalDelta.phi -= angle;

			}

			const panLeft = function () {

				const v = new THREE.Vector3();
				return function panLeft( distance, objectMatrix ) {

					v.setFromMatrixColumn( objectMatrix, 0 );

					v.multiplyScalar( - distance );
					panOffset.add( v );

				};

			}();

			const panUp = function () {

				const v = new THREE.Vector3();
				return function panUp( distance, objectMatrix ) {

					if ( scope.screenSpacePanning === true ) {

						v.setFromMatrixColumn( objectMatrix, 1 );

					} else {

						v.setFromMatrixColumn( objectMatrix, 0 );
						v.crossVectors( scope.object.up, v );

					}

					v.multiplyScalar( distance );
					panOffset.add( v );

				};

			}();


			const pan = function () {

				const offset = new THREE.Vector3();
				return function pan( deltaX, deltaY ) {

					const element = scope.domElement;

					if ( scope.object.isPerspectiveCamera ) {

						const position = scope.object.position;
						offset.copy( position ).sub( scope.target );
						let targetDistance = offset.length();

						targetDistance *= Math.tan( scope.object.fov / 2 * Math.PI / 180.0 );

						panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
						panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

					} else if ( scope.object.isOrthographicCamera ) {

						panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
						panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

					} else {

						console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
						scope.enablePan = false;

					}

				};

			}();

			function dollyOut( dollyScale ) {

				if ( scope.object.isPerspectiveCamera ) {

					scale /= dollyScale;

				} else if ( scope.object.isOrthographicCamera ) {

					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true;

				} else {

					console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
					scope.enableZoom = false;

				}

			}

			function dollyIn( dollyScale ) {

				if ( scope.object.isPerspectiveCamera ) {

					scale *= dollyScale;

				} else if ( scope.object.isOrthographicCamera ) {

					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true;

				} else {

					console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
					scope.enableZoom = false;

				}

			}


			function handleMouseDownRotate( event ) {

				rotateStart.set( event.clientX, event.clientY );

			}

			function handleMouseDownDolly( event ) {

				dollyStart.set( event.clientX, event.clientY );

			}

			function handleMouseDownPan( event ) {

				panStart.set( event.clientX, event.clientY );

			}

			function handleMouseMoveRotate( event ) {

				rotateEnd.set( event.clientX, event.clientY );
				rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
				const element = scope.domElement;
				rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight );

				rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
				rotateStart.copy( rotateEnd );
				scope.update();

			}

			function handleMouseMoveDolly( event ) {

				dollyEnd.set( event.clientX, event.clientY );
				dollyDelta.subVectors( dollyEnd, dollyStart );

				if ( dollyDelta.y > 0 ) {

					dollyOut( getZoomScale() );

				} else if ( dollyDelta.y < 0 ) {

					dollyIn( getZoomScale() );

				}

				dollyStart.copy( dollyEnd );
				scope.update();

			}

			function handleMouseMovePan( event ) {

				panEnd.set( event.clientX, event.clientY );
				panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
				pan( panDelta.x, panDelta.y );
				panStart.copy( panEnd );
				scope.update();

			}

			function handleMouseUp( ) {
			}

			function handleMouseWheel( event ) {

				if ( event.deltaY < 0 ) {

					dollyIn( getZoomScale() );

				} else if ( event.deltaY > 0 ) {

					dollyOut( getZoomScale() );

				}

				scope.update();

			}

			function handleKeyDown( event ) {

				let needsUpdate = false;

				switch ( event.code ) {

					case scope.keys.UP:
						pan( 0, scope.keyPanSpeed );
						needsUpdate = true;
						break;

					case scope.keys.BOTTOM:
						pan( 0, - scope.keyPanSpeed );
						needsUpdate = true;
						break;

					case scope.keys.LEFT:
						pan( scope.keyPanSpeed, 0 );
						needsUpdate = true;
						break;

					case scope.keys.RIGHT:
						pan( - scope.keyPanSpeed, 0 );
						needsUpdate = true;
						break;

				}

				if ( needsUpdate ) {

					event.preventDefault();
					scope.update();

				}

			}

			function handleTouchStartRotate( event ) {

				if ( event.touches.length == 1 ) {

					rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

				} else {

					const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
					const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
					rotateStart.set( x, y );

				}

			}

			function handleTouchStartPan( event ) {

				if ( event.touches.length == 1 ) {

					panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

				} else {

					const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
					const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
					panStart.set( x, y );

				}

			}

			function handleTouchStartDolly( event ) {

				const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				const distance = Math.sqrt( dx * dx + dy * dy );
				dollyStart.set( 0, distance );

			}

			function handleTouchStartDollyPan( event ) {

				if ( scope.enableZoom ) handleTouchStartDolly( event );
				if ( scope.enablePan ) handleTouchStartPan( event );

			}

			function handleTouchStartDollyRotate( event ) {

				if ( scope.enableZoom ) handleTouchStartDolly( event );
				if ( scope.enableRotate ) handleTouchStartRotate( event );

			}

			function handleTouchMoveRotate( event ) {

				if ( event.touches.length == 1 ) {

					rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

				} else {

					const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
					const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
					rotateEnd.set( x, y );

				}

				rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
				const element = scope.domElement;
				rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight );

				rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
				rotateStart.copy( rotateEnd );

			}

			function handleTouchMovePan( event ) {

				if ( event.touches.length == 1 ) {

					panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

				} else {

					const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
					const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
					panEnd.set( x, y );

				}

				panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
				pan( panDelta.x, panDelta.y );
				panStart.copy( panEnd );

			}

			function handleTouchMoveDolly( event ) {

				const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				const distance = Math.sqrt( dx * dx + dy * dy );
				dollyEnd.set( 0, distance );
				dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );
				dollyOut( dollyDelta.y );
				dollyStart.copy( dollyEnd );

			}

			function handleTouchMoveDollyPan( event ) {

				if ( scope.enableZoom ) handleTouchMoveDolly( event );
				if ( scope.enablePan ) handleTouchMovePan( event );

			}

			function handleTouchMoveDollyRotate( event ) {

				if ( scope.enableZoom ) handleTouchMoveDolly( event );
				if ( scope.enableRotate ) handleTouchMoveRotate( event );

			}

			function handleTouchEnd( ) {
			}


			function onPointerDown( event ) {

				if ( scope.enabled === false ) return;

				switch ( event.pointerType ) {

					case 'mouse':
					case 'pen':
						onMouseDown( event );
						break;

				}

			}

			function onPointerMove( event ) {

				if ( scope.enabled === false ) return;

				switch ( event.pointerType ) {

					case 'mouse':
					case 'pen':
						onMouseMove( event );
						break;

				}

			}

			function onPointerUp( event ) {

				switch ( event.pointerType ) {

					case 'mouse':
					case 'pen':
						onMouseUp( event );
						break;

				}

			}

			function onMouseDown( event ) {

				event.preventDefault();

				scope.domElement.focus ? scope.domElement.focus() : window.focus();
				let mouseAction;

				switch ( event.button ) {

					case 0:
						mouseAction = scope.mouseButtons.LEFT;
						break;

					case 1:
						mouseAction = scope.mouseButtons.MIDDLE;
						break;

					case 2:
						mouseAction = scope.mouseButtons.RIGHT;
						break;

					default:
						mouseAction = - 1;

				}

				switch ( mouseAction ) {

					case THREE.MOUSE.DOLLY:
						if ( scope.enableZoom === false ) return;
						handleMouseDownDolly( event );
						state = STATE.DOLLY;
						break;

					case THREE.MOUSE.ROTATE:
						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enablePan === false ) return;
							handleMouseDownPan( event );
							state = STATE.PAN;

						} else {

							if ( scope.enableRotate === false ) return;
							handleMouseDownRotate( event );
							state = STATE.ROTATE;

						}

						break;

					case THREE.MOUSE.PAN:
						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enableRotate === false ) return;
							handleMouseDownRotate( event );
							state = STATE.ROTATE;

						} else {

							if ( scope.enablePan === false ) return;
							handleMouseDownPan( event );
							state = STATE.PAN;

						}

						break;

					default:
						state = STATE.NONE;

				}

				if ( state !== STATE.NONE ) {

					scope.domElement.ownerDocument.addEventListener( 'pointermove', onPointerMove );
					scope.domElement.ownerDocument.addEventListener( 'pointerup', onPointerUp );
					scope.dispatchEvent( _startEvent );

				}

			}

			function onMouseMove( event ) {

				if ( scope.enabled === false ) return;
				event.preventDefault();

				switch ( state ) {

					case STATE.ROTATE:
						if ( scope.enableRotate === false ) return;
						handleMouseMoveRotate( event );
						break;

					case STATE.DOLLY:
						if ( scope.enableZoom === false ) return;
						handleMouseMoveDolly( event );
						break;

					case STATE.PAN:
						if ( scope.enablePan === false ) return;
						handleMouseMovePan( event );
						break;

				}

			}

			function onMouseUp( event ) {

				scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove );
				scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp );
				if ( scope.enabled === false ) return;
				handleMouseUp( event );
				scope.dispatchEvent( _endEvent );
				state = STATE.NONE;

			}

			function onMouseWheel( event ) {

				if ( scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE ) return;
				event.preventDefault();
				scope.dispatchEvent( _startEvent );
				handleMouseWheel( event );
				scope.dispatchEvent( _endEvent );

			}

			function onKeyDown( event ) {

				if ( scope.enabled === false || scope.enablePan === false ) return;
				handleKeyDown( event );

			}

			function onTouchStart( event ) {

				if ( scope.enabled === false ) return;
				event.preventDefault();

				switch ( event.touches.length ) {

					case 1:
						switch ( scope.touches.ONE ) {

							case THREE.TOUCH.ROTATE:
								if ( scope.enableRotate === false ) return;
								handleTouchStartRotate( event );
								state = STATE.TOUCH_ROTATE;
								break;

							case THREE.TOUCH.PAN:
								if ( scope.enablePan === false ) return;
								handleTouchStartPan( event );
								state = STATE.TOUCH_PAN;
								break;

							default:
								state = STATE.NONE;

						}

						break;

					case 2:
						switch ( scope.touches.TWO ) {

							case THREE.TOUCH.DOLLY_PAN:
								if ( scope.enableZoom === false && scope.enablePan === false ) return;
								handleTouchStartDollyPan( event );
								state = STATE.TOUCH_DOLLY_PAN;
								break;

							case THREE.TOUCH.DOLLY_ROTATE:
								if ( scope.enableZoom === false && scope.enableRotate === false ) return;
								handleTouchStartDollyRotate( event );
								state = STATE.TOUCH_DOLLY_ROTATE;
								break;

							default:
								state = STATE.NONE;

						}

						break;

					default:
						state = STATE.NONE;

				}

				if ( state !== STATE.NONE ) {

					scope.dispatchEvent( _startEvent );

				}

			}

			function onTouchMove( event ) {

				if ( scope.enabled === false ) return;
				event.preventDefault();

				switch ( state ) {

					case STATE.TOUCH_ROTATE:
						if ( scope.enableRotate === false ) return;
						handleTouchMoveRotate( event );
						scope.update();
						break;

					case STATE.TOUCH_PAN:
						if ( scope.enablePan === false ) return;
						handleTouchMovePan( event );
						scope.update();
						break;

					case STATE.TOUCH_DOLLY_PAN:
						if ( scope.enableZoom === false && scope.enablePan === false ) return;
						handleTouchMoveDollyPan( event );
						scope.update();
						break;

					case STATE.TOUCH_DOLLY_ROTATE:
						if ( scope.enableZoom === false && scope.enableRotate === false ) return;
						handleTouchMoveDollyRotate( event );
						scope.update();
						break;

					default:
						state = STATE.NONE;

				}

			}

			function onTouchEnd( event ) {

				if ( scope.enabled === false ) return;
				handleTouchEnd( event );
				scope.dispatchEvent( _endEvent );
				state = STATE.NONE;

			}

			function onContextMenu( event ) {

				if ( scope.enabled === false ) return;
				event.preventDefault();

			}


			scope.domElement.addEventListener( 'contextmenu', onContextMenu );
			scope.domElement.addEventListener( 'pointerdown', onPointerDown );
			scope.domElement.addEventListener( 'wheel', onMouseWheel, {
				passive: false
			} );
			scope.domElement.addEventListener( 'touchstart', onTouchStart, {
				passive: false
			} );
			scope.domElement.addEventListener( 'touchend', onTouchEnd );
			scope.domElement.addEventListener( 'touchmove', onTouchMove, {
				passive: false
			} );

			this.update();

		}

	}

	class MapControls extends OrbitControls {

		constructor( object, domElement ) {

			super( object, domElement );
			this.screenSpacePanning = false;

			this.mouseButtons.LEFT = THREE.MOUSE.PAN;
			this.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
			this.touches.ONE = THREE.TOUCH.PAN;
			this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

		}

	}

	THREE.MapControls = MapControls;
	THREE.OrbitControls = OrbitControls;

} )();


/* ======================================================================
   SHIPMENT LOADING DASHBOARD — Zoho Creator V2 Widget
   Pure HTML/CSS/JS + Three.js. Real 3D bin packing, live capacity math &
   validation, animated additions, realistic truck + editable quantities.
   PLUS: live Trip → Booking → Hub/Vehicle/Capacity mapping from Zoho
   Creator ("Trips", "Bookings", "Vehicles", "Locations2" reports).
   ====================================================================== */

/* ---------------- CONFIG ---------------- */
// Base/default cargo container size — this gets overwritten the instant
// the real Vehicle capacity loads from Zoho Creator (see applyTruckCapacity()).
let TRUCK_DIM_CM = { length: 800, width: 200, height: 200 };
let TRUCK_VOLUME_M3 = (TRUCK_DIM_CM.length/100) * (TRUCK_DIM_CM.width/100) * (TRUCK_DIM_CM.height/100);

/* Color palette auto-assigned to freely-typed item names (consistent per name via hash) */
const ITEM_COLOR_PALETTE = ['#d84343','#2fa84f','#2f5cff','#e0a521','#7a3fc9','#0fb5b5','#c9598a','#4c8bf5','#e07a2f','#3fa38f'];
const itemColorMap = {};
function colorForItemName(name){
  const key = name.trim().toLowerCase();
  if (itemColorMap[key]) return itemColorMap[key];
  let hash = 0;
  for (let i=0;i<key.length;i++){ hash = (hash*31 + key.charCodeAt(i)) >>> 0; }
  const color = ITEM_COLOR_PALETTE[hash % ITEM_COLOR_PALETTE.length];
  itemColorMap[key] = color;
  return color;
}

/* ---------------- STATE ---------------- */
let trucks = {
  "TRK-001": { items: [] }
};
let activeTruckId = "TRK-001";
let shipmentCounter = 1;

/* Record IDs of items that were removed locally but had already been
   saved to Shipment_Items — queued here and actually deleted from Zoho
   Creator only when "Save Shipment" is clicked. */
let pendingDeletes = [];
let isSavingShipment = false;

function generateShipmentId(){
  const id = 'SHP-' + String(shipmentCounter).padStart(4, '0');
  shipmentCounter += 1;
  return id;
}


/* ---------------- ZOHO CREATOR SDK INIT ----------------
   NOTE: ZOHO.CREATOR.init() is only called once, inside zohoInitAndLoad()
   below (which then chains straight into loading Trip/Booking/Hub data).
   Calling init() a second time here was redundant and could race with
   that call, so it has been removed. */

/* ---------------- DOM refs ---------------- */
const $ = id => document.getElementById(id);
const els = {
  item: $('f-item'), booking: $('f-booking'), hub: $('f-hub'), qty: $('f-qty'), qtyUnit: $('f-qty-unit'),
  pkg: $('f-pkg'), weight: $('f-weight'), rate: $('f-rate'),
  len: $('f-len'), wid: $('f-wid'), hei: $('f-hei'), remarks: $('f-remarks'),
  addBtn: $('btn-add'), resetBtn: $('btn-reset'), formError: $('form-error'),
  capHint: $('capacity-hint'), overCapBanner: $('over-capacity-banner'),
  saveBtn: $('btn-save-shipment'),

  vizBookingId: $('viz-booking-id'), capValue: $('cap-value'),
  progressFill: $('progress-fill'), usedSpace: $('used-space'), remSpace: $('rem-space'),
  threeContainer: $('three-container'), vizEmpty: $('viz-empty'), threeError: $('three-error'),
  sumLen: $('sum-len'), sumWid: $('sum-wid'), sumHei: $('sum-hei'), sumVol: $('sum-vol'),
  itemsBody: $('items-body'), noItemsMsg: $('no-items-msg'), itemsTruckLabel: $('items-truck-label'),
  toast: $('toast')
};

/* ======================================================================
   ZOHO CREATOR LIVE DATA — Trip → Booking → Hub/Vehicle/Capacity mapping,
   plus the Shipment_Items save/sync workflow further down this file.
   Adjust the values in ZOHO_CONFIG to match your actual app/report/field
   link names in Zoho Creator.
   ====================================================================== */
const ZOHO_CONFIG = {
  appName: "logistics-app",                 // your Creator app link name — ⚠ CONFIRM this too

  // NOTE: the "Booking_Shipments" form you shared has no Trip lookup and
  // no Vehicle field at all — so there is currently no way for this
  // widget to look up a real truck capacity per booking. The 4 lines
  // below are inert placeholders: bookingTripLookupField and
  // bookingVehicleOverrideField will simply find nothing on your actual
  // Booking record (harmless no-op), so TRUCK_VOLUME_M3 stays at the
  // static default (TRUCK_DIM_CM at the top of this file) for every
  // booking. If you want real per-booking capacity, add a Vehicle (or
  // capacity) field to Booking_Shipments and tell me its field link name.
  tripsReport: "Trips",
  tripIdField: "Trip_ID",
  tripVehicleField: "Vehicle",
  tripDefaultBookingField: "Booking_ID",

  bookingsReport: "All_Booking_Shipments",  // ⚠ CONFIRM: must be the exact Report Link Name for records built on the "Booking_Shipments" form — this is a best guess, not verified against your app
  bookingIdField: "Booking_ID",
  bookingTripLookupField: "Trip_ID",        // does not exist on Booking_Shipments — no-ops, see note above
  bookingHubField: "Assigned_Hub",
  bookingVehicleOverrideField: "Vehicle",   // does not exist on Booking_Shipments — no-ops, see note above

  vehiclesReport: "Vehicles",
  vehicleCapacityField: "Capacity",         // stores capacity in m3

  // Hub Name dropdown is populated from this report (per the live-mapping
  // requirement), while the Shipment_Items.Hub_Name field itself is a
  // picklist whose values come from the "Locations" form (per the form
  // definition you supplied: values = Locations.ID). If Locations2 and
  // Locations don't share the same record IDs in your app, change
  // locationsReport below to "Locations" so the ID captured here is the
  // exact one Shipment_Items expects.
  locationsReport: "Locations2",
  locationHubField: "Hub_Name",

  // ---- Shipment_Items form/report — field link names taken directly
  // from the form definition you supplied. ----
  shipmentItemsForm: "Shipment_Items",      // used for creating (addRecord)
  shipmentItemsReport: "Shipment_Items",    // used for reading/updating/deleting
  f_item: "Item",
  f_hub: "Hub_Name",
  f_qty: "Quantity",
  f_pkgType: "Package_Type",
  f_weight: "Weight",
  f_rate: "Rate_Per_Kg",
  f_length: "Length_field1",
  f_width: "Width",
  f_height: "Hight",              // yes, matches the actual (misspelled) field link name
  f_remarks: "Remarks",
  f_bookingLookup: "Booking_Shipments"  // stores the linked Booking record's ID
};

/* Maps a Hub Name display string -> its Locations record ID, captured
   while loadHubNames() populates the dropdown. Used when saving, since
   Shipment_Items.Hub_Name is a picklist that stores a record ID, not
   plain text. */
let hubOptionsMap = {};
/* Reverse of hubOptionsMap (Locations record ID -> display Hub Name), used
   to re-hydrate previously-saved Shipment_Items rows back into readable
   Hub Name text when they're loaded on open. */
let hubIdToName = {};

let currentBookingRecordId = null;

/* Zoho Creator returns lookup fields as an OBJECT (commonly
   { ID: "...", display_value / zc_display_value: "..." }), not a plain
   string — reading them as strings directly is what was breaking the
   Hub Name / Booking ID / Vehicle mapping. These two helpers normalize
   any field value (plain text, number, or a lookup object) down to the
   piece we actually need. */
function lookupId(fieldValue){
  if (fieldValue === null || fieldValue === undefined) return '';
  if (typeof fieldValue === 'object'){
    return fieldValue.ID || fieldValue.id || '';
  }
  return String(fieldValue);
}
function lookupDisplayValue(fieldValue){
  if (fieldValue === null || fieldValue === undefined) return '';
  if (typeof fieldValue === 'object'){
    return fieldValue.display_value || fieldValue.zc_display_value || fieldValue.ID || fieldValue.id || '';
  }
  return String(fieldValue);
}

/* ZOHO.CREATOR.UTIL.getQueryParams() reads the normal "?key=value" part
   of the URL. But this widget's button opens it as:
     openUrl("#Page:Shipment_Items1?Booking_ID=" + input.ID, ...)
   — which puts "Booking_ID" INSIDE the "#Page:..." hash, not in the
   plain URL query string. Some Creator SDK versions/contexts don't parse
   that. So this reads params from getQueryParams() AND manually pulls
   any "?key=value" pairs out of the hash itself, merging both — whichever
   actually has the value wins. */
function getWidgetParams(){
  let params = {};
  try {
    if (ZOHO.CREATOR.UTIL && typeof ZOHO.CREATOR.UTIL.getQueryParams === 'function'){
      params = Object.assign({}, ZOHO.CREATOR.UTIL.getQueryParams());
    }
  } catch (e){
    console.warn("ZOHO.CREATOR.UTIL.getQueryParams() failed:", e);
  }

  const hash = window.location.hash || '';
  const hashQueryIndex = hash.indexOf('?');
  if (hashQueryIndex !== -1){
    new URLSearchParams(hash.slice(hashQueryIndex + 1)).forEach((value, key)=>{
      if (!params[key]) params[key] = value;
    });
  }
  new URLSearchParams(window.location.search).forEach((value, key)=>{
    if (!params[key]) params[key] = value;
  });

  console.log('[Shipment Items widget] resolved params:', params, '| raw href:', window.location.href);
  return params;
}

function zohoInitAndLoad(){
  if (!(window.ZOHO && ZOHO.CREATOR)){
    console.warn("Zoho SDK not present — widget running outside Creator, using static demo data.");
    return;
  }
  ZOHO.CREATOR.init().then(function(){
    const params = getWidgetParams();
    // The "Shipment Items" button's Deluge script is:
    //   openUrl("#Page:Shipment_Items1?Booking_ID=" + input.ID, ...)
    // That passes the SELECTED Booking record's own Zoho record ID (its
    // System ID) under the key "Booking_ID" — NOT the display text like
    // "SKY-BK-015". So it must be read as a record ID (for getRecordById),
    // not searched for as display text. recordId/ID/bookingRecordId are
    // kept as extra accepted key names in case the button URL changes.
    const bookingRecordId = params.Booking_ID || params.recordId || params.ID || params.bookingRecordId;
    // Fallback only: if some other button instead passes the plain
    // Booking ID display text (e.g. "SKY-BK-015") under a different key,
    // look the record up by that value instead.
    const bookingIdValue = params.bookingIdDisplay || params.bookingId;

    loadHubNames(); // independent of the booking — load once, always

    if (bookingRecordId){
      loadBookingLiveData(bookingRecordId);
    } else if (bookingIdValue){
      loadBookingByDisplayValue(bookingIdValue);
    } else {
      console.warn("No Booking record was passed to the widget — using static demo data. Params seen:", params);
      showToast('⚠ No Booking was passed to this page — check the button URL/params (see browser console).', 'error');
    }
  }).catch(function(err){
    console.warn("Zoho SDK init failed, using static demo data.", err);
  });
}

/* Fetches the exact Booking record the "Shipment Items" button was
   clicked from (by its Zoho record ID) and maps its Booking ID, Hub, and
   Vehicle capacity onto the dashboard. */
function loadBookingLiveData(bookingRecordId){
  console.log('[Shipment Items widget] fetching Booking by ID:', {
    appName: ZOHO_CONFIG.appName, reportName: ZOHO_CONFIG.bookingsReport, id: bookingRecordId
  });
  ZOHO.CREATOR.API.getRecordById({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.bookingsReport,
    id: bookingRecordId
  }).then(function(res){
    console.log('[Shipment Items widget] getRecordById response:', res);
    const booking = res && res.data;
    if (!booking){ console.warn("Booking not found:", bookingRecordId); showToast('⚠ Booking record not found — check appName/reportName in ZOHO_CONFIG.', 'error'); return; }
    applyBookingRecord(booking);
  }).catch(function(err){
    console.error("Failed to load Booking record — check ZOHO_CONFIG.appName ('" + ZOHO_CONFIG.appName + "') and ZOHO_CONFIG.bookingsReport ('" + ZOHO_CONFIG.bookingsReport + "') match your actual Zoho Creator link names:", err);
    showToast('⚠ Could not load Booking data — check appName/reportName (see console)', 'error');
  });
}

/* Fallback path if the button only passes the Booking_ID text value
   instead of the record's System ID — looks the record up by that value
   instead of fetching it directly. */
function loadBookingByDisplayValue(bookingIdValue){
  ZOHO.CREATOR.API.getAllRecords({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.bookingsReport,
    criteria: `${ZOHO_CONFIG.bookingIdField} == "${bookingIdValue}"`
  }).then(function(res){
    const booking = res && res.data && res.data[0];
    if (!booking){ console.warn("Booking not found:", bookingIdValue); return; }
    applyBookingRecord(booking);
  }).catch(function(err){
    console.error("Failed to load Booking record by Booking ID:", err);
    showToast('⚠ Could not load Booking data from Zoho Creator', 'error');
  });
}

/* Maps the selected Booking record straight onto the dashboard: the
   Booking ID display field, its Hub Name, its Vehicle capacity (its own
   override if set, otherwise its linked Trip's Vehicle), and its
   previously-saved Shipment Items. This is the single source of truth
   for "which booking are we on" — there's no dropdown to pick a
   different one from anymore. */
function applyBookingRecord(booking){
  currentBookingRecordId = booking.ID;

  // Booking ID is now a plain, auto-mapped display field (not a lookup
  // dropdown) — it always reflects the Booking record the button was
  // clicked from, never something the user can accidentally change.
  const bookingIdDisplay = lookupDisplayValue(booking[ZOHO_CONFIG.bookingIdField]) || booking.ID;
  els.booking.value = bookingIdDisplay;
  els.vizBookingId.textContent = bookingIdDisplay;

  // Hub Name dropdown options are keyed by display text (see loadHubNames()),
  // so match against the display value even if this comes back as a lookup object.
  const bookingHub = lookupDisplayValue(booking[ZOHO_CONFIG.bookingHubField]);
  if (bookingHub){
    if ([...els.hub.options].some(o => o.value === bookingHub)){
      els.hub.value = bookingHub;
    } else {
      // Hub list hasn't finished loading yet — apply it once loadHubNames()
      // finishes populating real options.
      els.hub.dataset.pendingHubName = bookingHub;
    }
  }

  // Vehicle override is a lookup on the Booking itself — loadVehicleCapacity()
  // needs the actual record ID, not the display text, to call getRecordById().
  // If the booking doesn't override the vehicle, fall back to its linked Trip's Vehicle.
  const overrideVehicleId = lookupId(booking[ZOHO_CONFIG.bookingVehicleOverrideField]);
  if (overrideVehicleId){
    loadVehicleCapacity(overrideVehicleId);
  } else {
    const tripRecordId = lookupId(booking[ZOHO_CONFIG.bookingTripLookupField]);
    if (tripRecordId) loadVehicleFromTrip(tripRecordId);
  }

  // Pull this booking's own previously-saved Loaded Items from
  // Shipment_Items so the list (and capacity math) reflects what's really
  // saved in Zoho Creator, and so Save Shipment updates/removes existing
  // rows instead of ever duplicating them.
  loadExistingItemsForBooking(currentBookingRecordId);

  refreshAll();
}

/* Fetches a Booking's linked Trip and applies the Trip's assigned
   Vehicle's capacity — used only when the Booking itself doesn't
   override the Vehicle. */
function loadVehicleFromTrip(tripRecordId){
  ZOHO.CREATOR.API.getRecordById({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.tripsReport,
    id: tripRecordId
  }).then(function(res){
    const trip = res && res.data;
    const vehicleId = trip && lookupId(trip[ZOHO_CONFIG.tripVehicleField]);
    if (vehicleId) loadVehicleCapacity(vehicleId);
  }).catch(function(err){
    console.error("Failed to load Trip's Vehicle for capacity:", err);
  });
}

/* Fetches the Vehicle record and applies its real capacity (m3) to the
   dashboard — this becomes the single source of truth for used/remaining
   space math AND the 3D truck body size. */
function loadVehicleCapacity(vehicleId){
  ZOHO.CREATOR.API.getRecordById({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.vehiclesReport,
    id: vehicleId
  }).then(function(res){
    const vehicle = res && res.data;
    const capacity = vehicle && parseFloat(vehicle[ZOHO_CONFIG.vehicleCapacityField]);
    if (capacity && capacity > 0) applyTruckCapacity(capacity);
  }).catch(function(err){
    console.error("Failed to load Vehicle capacity:", err);
    showToast('⚠ Could not load vehicle capacity', 'error');
  });
}

/* Rescales the truck's length/width/height proportionally so its volume
   matches the real fetched capacity exactly, then rebuilds the 3D model
   at that size and re-runs all capacity math against it. */
function applyTruckCapacity(capacityM3){
  const currentVol = (TRUCK_DIM_CM.length/100)*(TRUCK_DIM_CM.width/100)*(TRUCK_DIM_CM.height/100);
  const scale = Math.cbrt(capacityM3 / currentVol);
  TRUCK_DIM_CM = {
    length: Math.round(TRUCK_DIM_CM.length * scale),
    width: Math.round(TRUCK_DIM_CM.width * scale),
    height: Math.round(TRUCK_DIM_CM.height * scale)
  };
  TRUCK_VOLUME_M3 = capacityM3;

  if (threeReady){
    while (containerGroup.children.length) containerGroup.remove(containerGroup.children[0]);
    cargoGroup = null;
    buildTruckModel();
    buildDimensionAnnotations();
  }
  refreshAll();
}

/* Pulls every Shipment_Items row already linked to this booking so the
   Loaded Items list (and capacity math) reflects what's really saved in
   Zoho Creator, and so each item's recordId is known up front — this is
   what lets Save Shipment update/delete existing rows instead of ever
   re-creating (duplicating) them. */
function loadExistingItemsForBooking(bookingRecordId){
  if (!(window.ZOHO && ZOHO.CREATOR) || !bookingRecordId) return;
  ZOHO.CREATOR.API.getAllRecords({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.shipmentItemsReport,
    criteria: `${ZOHO_CONFIG.f_bookingLookup} == ${bookingRecordId}`
  }).then(function(res){
    const rows = (res && res.data) || [];
    const items = rows.map(r=>{
      const len = parseFloat(r[ZOHO_CONFIG.f_length]) || 0;
      const wid = parseFloat(r[ZOHO_CONFIG.f_width]) || 0;
      const hei = parseFloat(r[ZOHO_CONFIG.f_height]) || 0;
      const hubId = lookupId(r[ZOHO_CONFIG.f_hub]) || r[ZOHO_CONFIG.f_hub];
      const name = r[ZOHO_CONFIG.f_item] || 'Item';
      return {
        recordId: r.ID,
        _qtyDirty: false,
        shipmentId: generateShipmentId(),
        name,
        bookingId: els.booking.value,
        bookingRecordId,
        hub: hubIdToName[hubId] || hubId || '',
        qty: parseFloat(r[ZOHO_CONFIG.f_qty]) || 0,
        qtyUnit: 'PCS',
        pkgType: r[ZOHO_CONFIG.f_pkgType] || 'Box',
        weight: parseFloat(r[ZOHO_CONFIG.f_weight]) || 0,
        rate: parseFloat(r[ZOHO_CONFIG.f_rate]) || 0,
        len, wid, hei,
        unitVolumeM3: (len/100) * (wid/100) * (hei/100),
        color: colorForItemName(name),
        remarks: r[ZOHO_CONFIG.f_remarks] || ''
      };
    });
    trucks[activeTruckId].items = items;
    refreshAll();
  }).catch(function(err){
    console.error('Failed to load existing Shipment Items for booking:', err);
    showToast('⚠ Could not load previously saved items for this booking', 'error');
  });
}

/* Loads every distinct Hub Name from Locations2 into the Hub Name
   dropdown. Independent of Trip/Booking — runs once on load. */
function loadHubNames(){
  ZOHO.CREATOR.API.getAllRecords({
    appName: ZOHO_CONFIG.appName,
    reportName: ZOHO_CONFIG.locationsReport
  }).then(function(res){
    const rows = (res && res.data) || [];
    hubOptionsMap = {};
    hubIdToName = {};
    const names = [];
    rows.forEach(r=>{
      // Only the Hub Name value itself is shown/used from Locations2 — every
      // other field on the record is ignored.
      const n = r[ZOHO_CONFIG.locationHubField];
      if (!n || hubOptionsMap[n]) return;
      hubOptionsMap[n] = r.ID;
      hubIdToName[r.ID] = n;
      names.push(n);
    });
    if (!names.length){
      els.hub.innerHTML = '<option value="">No hubs found</option>';
      return;
    }
    els.hub.innerHTML = '';
    names.forEach(n=>{
      const opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      els.hub.appendChild(opt);
    });
    // A booking may already have loaded before the hub list finished
    // fetching — re-apply its Hub Name now that real options exist.
    const pendingHub = els.hub.dataset.pendingHubName;
    if (pendingHub && [...els.hub.options].some(o => o.value === pendingHub)){
      els.hub.value = pendingHub;
      delete els.hub.dataset.pendingHubName;
    }
  }).catch(function(err){
    console.error("Failed to load hub names from Locations2:", err);
    showToast('⚠ Could not load hub names', 'error');
  });
}

/* ---------------- TOAST ---------------- */
let toastTimer;
function showToast(msg, type){
  els.toast.textContent = msg;
  els.toast.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> els.toast.classList.remove('show'), 2600);
}

/* ---------------- CAPACITY MATH ---------------- */
function getTruck(){ return trucks[activeTruckId]; }

function computeUsedVolume(){
  return getTruck().items.reduce((sum,it)=> sum + it.unitVolumeM3 * it.qty, 0);
}
function computeUsedWeight(){
  return getTruck().items.reduce((sum,it)=> sum + it.weight * it.qty, 0);
}

let lastUsedShown = 0; // for smooth count-up animation between renders
function animateNumber(fromVal, toVal, durationMs, onFrame){
  const start = performance.now();
  function step(t){
    const p = Math.min(1, (t-start)/durationMs);
    const eased = 1 - Math.pow(1-p, 3); // easeOutCubic
    onFrame(fromVal + (toVal-fromVal)*eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function refreshCapacityUI(){
  const used = computeUsedVolume();
  const pct = Math.min(999, (used / TRUCK_VOLUME_M3) * 100);
  const remaining = Math.max(TRUCK_VOLUME_M3 - used, 0);

  els.capValue.textContent = TRUCK_VOLUME_M3.toFixed(2) + ' m³';
  els.itemsTruckLabel.textContent = activeTruckId;

  const startUsed = lastUsedShown;
  animateNumber(startUsed, used, 450, (v)=>{
    const r = Math.max(TRUCK_VOLUME_M3 - v, 0);
    const p = Math.min(999, (v/TRUCK_VOLUME_M3)*100);
    const rp = Math.max(0, 100-p);
    els.usedSpace.textContent = v.toFixed(2) + ' m³ (' + p.toFixed(2) + '%)';
    els.remSpace.textContent = r.toFixed(2) + ' m³ (' + rp.toFixed(2) + '%)';
  });
  lastUsedShown = used;

  els.progressFill.style.width = Math.min(pct,100) + '%';
  els.progressFill.classList.remove('warn','over');
  if (pct > 100) els.progressFill.classList.add('over');
  else if (pct > 85) els.progressFill.classList.add('warn');

  els.sumLen.textContent = TRUCK_DIM_CM.length + ' cm';
  els.sumWid.textContent = TRUCK_DIM_CM.width + ' cm';
  els.sumHei.textContent = TRUCK_DIM_CM.height + ' cm';
  els.sumVol.textContent = '📦 ' + TRUCK_VOLUME_M3.toFixed(2) + ' m³';

  if (pct > 100){
    els.capHint.style.color = '#e0343e';
    els.capHint.textContent = '⚠ Over capacity by ' + (used - TRUCK_VOLUME_M3).toFixed(2) + ' m³. Consider adding another truck.';
  } else {
    els.capHint.style.color = 'var(--muted)';
    els.capHint.textContent = remaining.toFixed(2) + ' m³ free on ' + activeTruckId + '.';
  }
}

/* ---------------- ITEMS TABLE (with inline editable Qty) ---------------- */
function refreshItemsTable(){
  const items = getTruck().items;
  els.itemsBody.innerHTML = '';
  els.noItemsMsg.style.display = items.length ? 'none' : 'block';
  items.forEach((it, idx)=>{
    const tr = document.createElement('tr');
    tr.className = 'row-in';
    tr.style.animationDelay = (idx * 30) + 'ms';
    tr.innerHTML = `
      <td>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:10.5px;color:var(--muted);font-weight:700;letter-spacing:.4px;">${it.shipmentId || 'SHP-0000'}</span>
          <span><span class="swatch" style="background:${it.color}"></span>${it.name}</span>
        </div>
      </td>
      <td>
        <div class="qty-cell">
          <input type="number" class="qty-edit" min="1" step="1" value="${it.qty}" data-idx="${idx}">
          <span class="qty-unit-label">${it.qtyUnit}</span>
        </div>
      </td>
      <td>${it.len}×${it.wid}×${it.hei}</td>
      <td>${(it.unitVolumeM3*it.qty).toFixed(2)}m³</td>
      <td><span class="remove-btn" data-idx="${idx}">✕</span></td>
    `;
    els.itemsBody.appendChild(tr);
  });

  /* Removing here only updates the local list + visualization. Nothing is
     deleted from Zoho Creator until "Save Shipment" is clicked — if the
     item was already saved (has a recordId), that ID is queued in
     pendingDeletes so Save Shipment removes it from Shipment_Items too. */
  els.itemsBody.querySelectorAll('.remove-btn').forEach(btn=>{
    btn.onclick = ()=> {
      const idx = parseInt(btn.dataset.idx);
      const item = getTruck().items[idx];
      if (item && item.recordId){
        pendingDeletes.push(item.recordId);
      }
      getTruck().items.splice(idx,1);
      refreshAll();
      showToast('Item removed — click Save Shipment to sync');
    };
  });

  /* Editing Qty here updates capacity math AND the 3D truck loading
     visualization immediately. The only restriction is real truck
     capacity — any quantity is allowed as long as it fits. The change is
     only flagged (_qtyDirty) for sync to Zoho Creator — it's written on
     the next "Save Shipment" click, not immediately. */
  els.itemsBody.querySelectorAll('.qty-edit').forEach(input=>{
    input.addEventListener('change', ()=>{
      const idx = parseInt(input.dataset.idx);
      const item = getTruck().items[idx];
      if (!item) return;
      let newQty = parseInt(input.value);
      if (!newQty || newQty < 1){ newQty = 1; }

      const otherVolume = getTruck().items.reduce((sum, it2, i2)=>
        i2 === idx ? sum : sum + it2.unitVolumeM3 * it2.qty, 0);
      const availableForThis = Math.max(0, TRUCK_VOLUME_M3 - otherVolume);
      const maxUnitsThatFit = Math.floor(availableForThis / item.unitVolumeM3);

      if (newQty > maxUnitsThatFit){
        newQty = Math.max(1, maxUnitsThatFit);
        flashOverCapacity();
        showToast('⚠ Capped at ' + newQty + ' ' + item.qtyUnit + ' — that\'s all the truck can fit for this item.', 'error');
      }

      if (newQty !== item.qty && item.recordId){
        item._qtyDirty = true;
      }
      item.qty = newQty;
      input.value = newQty;
      refreshAll(); // re-triggers capacity math + 3D re-pack immediately
    });
    input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') input.blur(); });
  });
}

/* ======================================================================
   3D SCENE — Three.js
   ====================================================================== */
let scene, camera, renderer, controls, containerGroup, animationId;

function initThree(){
  try {
    if (typeof THREE === 'undefined' || typeof THREE.OrbitControls === 'undefined'){
      showThreeError('3D library did not load (THREE or OrbitControls undefined).');
      return false;
    }
    const w = els.threeContainer.clientWidth || 800;
    const h = els.threeContainer.clientHeight || 480;
    if (!w || !h){ showThreeError('Truck viewport has zero size — widget container may not be sized yet.'); return false; }

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(42, w/h, 1, 5000);
    // Fixed, right-side-only viewing angle — no other sides are ever shown.
    camera.position.set(TRUCK_DIM_CM.length*0.5, TRUCK_DIM_CM.height*1.05, TRUCK_DIM_CM.width*2.6);
    camera.lookAt(TRUCK_DIM_CM.length/2, TRUCK_DIM_CM.height*0.35, 0);

    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.setSize(w,h,false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    els.threeContainer.insertBefore(renderer.domElement, els.threeContainer.firstChild);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(TRUCK_DIM_CM.length/2, TRUCK_DIM_CM.height*0.35, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;   // zoom disabled — fixed framing only
    controls.enablePan = false;    // keep the truck centered, no free dragging
    controls.enableRotate = false; // locked — right-side view only, no other sides shown
    controls.update();

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(600, 900, 500);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024,1024);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xaac0ff, 0.3);
    fill.position.set(-600,400,-400);
    scene.add(fill);

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000,4000),
      new THREE.MeshStandardMaterial({ color:0xdfe4ee, roughness:1 })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    containerGroup = new THREE.Group();
    scene.add(containerGroup);

    buildTruckModel();
    buildDimensionAnnotations();

    // paint one frame immediately — don't wait on the rAF loop to confirm it works
    renderer.render(scene, camera);

    animate();
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined'){
      new ResizeObserver(()=>onResize()).observe(els.threeContainer);
    }
    return true;
  } catch (err){
    console.error('3D init failed:', err);
    showThreeError('3D init error: ' + (err && err.message ? err.message : err));
    return false;
  }
}

function showThreeError(msg){
  els.threeError.textContent = msg;
  els.threeError.style.display = 'flex';
}

function onResize(){
  if (!renderer || !camera) return;
  const w = els.threeContainer.clientWidth, h = els.threeContainer.clientHeight;
  if (!w || !h) return;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}

function animate(){
  animationId = requestAnimationFrame(animate);
  try {
    controls.update();
    renderer.render(scene, camera);
  } catch (err){
    console.error('Render loop error:', err);
    cancelAnimationFrame(animationId);
    showThreeError('Rendering stopped: ' + (err && err.message ? err.message : err));
  }
}

/* --- Build a realistic truck: rounded blue cab (grille / headlights /
   windshield / mirrors), a properly-fitted closed cargo container with a
   structural seam/corner-post frame, chassis rails, and correctly aligned
   front + rear wheels (front single axle, rear tandem dual/twin-wheel
   axles) all sharing the same ground-contact height. --- */
function buildTruckModel(){
  const L = TRUCK_DIM_CM.length, W = TRUCK_DIM_CM.width, H = TRUCK_DIM_CM.height;
  const truck = new THREE.Group();
  const R = 34; // shared wheel radius for front + rear so ride height matches everywhere

  /* ---------------- trailer floor ---------------- */
  const floorMat = new THREE.MeshStandardMaterial({ color:0x2a2d33, roughness:.85 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 8, W), floorMat);
  floor.position.set(L/2, 4, 0);
  floor.receiveShadow = true;
  truck.add(floor);

  /* ---------------- closed cargo container ----------------
     Slightly inset from the chassis rails (visual-only — cargo capacity
     math is untouched) so the panels read as a properly fitted box rather
     than clipping the wheels, with a real corner-post + seam frame so it
     looks like an actual fabricated container instead of a bare shape. */
  const CONTAINER_W = W - 6;
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0xc7ccd5, roughness:.42, metalness:.18,
    transparent:true, opacity:.32, side:THREE.DoubleSide
  });
  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(L, H, CONTAINER_W), boxMat);
  cargoBox.position.set(L/2, H/2, 0);
  truck.add(cargoBox);

  // Keep the trailer body readable without hiding the cargo packed inside it.
  const wallMat = new THREE.MeshStandardMaterial({ color:0xb5bcc9, roughness:.45, metalness:.15, transparent:true, opacity:.28 });
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(L - 16, H - 18, 3), wallMat);
  wallLeft.position.set(L/2, H/2, -CONTAINER_W/2 + 1.5);
  truck.add(wallLeft);
  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(L - 16, H - 18, 3), wallMat);
  wallRight.position.set(L/2, H/2, CONTAINER_W/2 - 1.5);
  truck.add(wallRight);
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(3, H - 18, CONTAINER_W - 14), wallMat);
  wallFront.position.set(10, H/2, 0);
  truck.add(wallFront);

  // structural edge frame (panel seams) so the container reads as a real
  // fabricated box rather than a flat translucent shape
  const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, CONTAINER_W));
  const edgeMat = new THREE.LineBasicMaterial({ color:0x535d6b, linewidth:1 });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.position.copy(cargoBox.position);
  truck.add(edges);

  // corner posts — the vertical structural members of a real box container
  const postMat = new THREE.MeshStandardMaterial({ color:0x2b2e34, roughness:.5, metalness:.35 });
  [ -CONTAINER_W/2, CONTAINER_W/2 ].forEach(z=>{
    [8, L-8].forEach(x=>{
      const post = new THREE.Mesh(new THREE.BoxGeometry(6, H, 6), postMat);
      post.position.set(x, H/2, z);
      truck.add(post);
    });
  });

  // dark trim bands top/bottom (roofline / skirt line)
  const trimMat = new THREE.MeshStandardMaterial({ color:0x2b2e34, roughness:.6, metalness:.3 });
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(L, 6, CONTAINER_W+2), trimMat);
  topTrim.position.set(L/2, H, 0);
  truck.add(topTrim);
  const botTrim = new THREE.Mesh(new THREE.BoxGeometry(L, 6, CONTAINER_W+2), trimMat);
  botTrim.position.set(L/2, 8, 0);
  truck.add(botTrim);

  // corrugated ribs — thin vertical seams along the side, kept as slim
  // strips (not solid panels) so cargo stays visible through the container
  const ribMat = new THREE.MeshStandardMaterial({ color:0xb9bec8, roughness:.5, metalness:.2, transparent:true, opacity:.55 });
  for (let rx = 60; rx < L-40; rx += 90){
    const rib = new THREE.Mesh(new THREE.BoxGeometry(3, H-14, 2), ribMat);
    rib.position.set(rx, H/2, CONTAINER_W/2 - 0.5);
    truck.add(rib);
  }

  // rear door seam + tail-light cluster (small red lamps at the tail, low corners)
  const doorSeamMat = new THREE.MeshStandardMaterial({ color:0x9aa0ab, roughness:.4, metalness:.3 });
  const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(2, H-6, 3), doorSeamMat);
  doorSeam.position.set(L-1, H/2, 0);
  truck.add(doorSeam);
  const tailLightMat = new THREE.MeshStandardMaterial({ color:0xcc2020, emissive:0x991414, emissiveIntensity:.5, roughness:.4 });
  [CONTAINER_W/2-14, -(CONTAINER_W/2-14)].forEach(z=>{
    const tl = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 8), tailLightMat);
    tl.position.set(L-2, 26, z);
    truck.add(tl);
  });

  // skirt panel closing the gap between the container floor and the
  // chassis so the box looks properly seated on the truck bed
  const skirtMat = new THREE.MeshStandardMaterial({ color:0x1e2126, roughness:.7, metalness:.2 });
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(L-20, 10, CONTAINER_W-4), skirtMat);
  skirt.position.set(L/2, -3, 0);
  truck.add(skirt);

  /* ---------------- chassis rails + cross-braces ---------------- */
  const chassisMat = new THREE.MeshStandardMaterial({ color:0x2b2e34, roughness:.5, metalness:.6 });
  [W/2 - 14, -W/2 + 14].forEach(z=>{
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L+60, 14, 12), chassisMat);
    rail.position.set(L/2, -10, z);
    truck.add(rail);
  });
  for (let cx = 60; cx < L; cx += 140){
    const brace = new THREE.Mesh(new THREE.BoxGeometry(10, 10, W-28), chassisMat);
    brace.position.set(cx, -10, 0);
    truck.add(brace);
  }

  function makeWheel(x, z){
    const tyreMat = new THREE.MeshStandardMaterial({ color:0x101214, roughness:.85, metalness:.05 });
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 18, 18), tyreMat);
    tyre.rotation.z = Math.PI/2;
    tyre.position.set(x, R - 2, z);
    tyre.castShadow = true; tyre.receiveShadow = true;
    truck.add(tyre);

    const rimMat = new THREE.MeshStandardMaterial({ color:0xc8ced6, roughness:.3, metalness:.75 });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.58, R * 0.58, 12, 16), rimMat);
    rim.rotation.z = Math.PI/2;
    rim.position.set(x, R - 2, z);
    truck.add(rim);

    return tyre;
  }
  function addMudFlap(x, z){
    const flapMat = new THREE.MeshStandardMaterial({ color:0x1b1d24, roughness:.8 });
    const flap = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 4), flapMat);
    flap.position.set(x, 14, z);
    truck.add(flap);
  }

  // rear tandem axle group — two axles, twin (dual) wheels each side, all
  // flush with the chassis rails and evenly spaced near the tail.
  const DUAL_GAP = 18;
  const outerZ = (CONTAINER_W/2) - (R + 6);
  const innerZ = outerZ - DUAL_GAP;
  const rearAxleXs = [L-165, L-75];
  rearAxleXs.forEach(x=>{
    makeWheel(x, outerZ);
    makeWheel(x, innerZ);
    makeWheel(x, -outerZ);
    makeWheel(x, -innerZ);
    const axleMat = new THREE.MeshStandardMaterial({ color:0x1c1e22, roughness:.6, metalness:.5 });
    const axleRod = new THREE.Mesh(new THREE.CylinderGeometry(6,6, (outerZ*2)+20, 12), axleMat);
    axleRod.rotation.x = Math.PI/2;
    axleRod.position.set(x, R-4, 0);
    truck.add(axleRod);
  });
  addMudFlap(rearAxleXs[1], outerZ + 10);
  addMudFlap(rearAxleXs[1], -outerZ - 10);

  /* ---------------- cab: navy blue, rounded profile, chrome grille & headlights ---------------- */
  const cabMat = new THREE.MeshStandardMaterial({ color:0x141a5c, roughness:.3, metalness:.5 });
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(130, 120, W-6), cabMat);
  cabBody.position.set(-90, 70, 0);
  cabBody.castShadow = true;
  truck.add(cabBody);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(110, 14, W-16), cabMat.clone());
  cabRoof.position.set(-90, 142, 0);
  truck.add(cabRoof);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(45, 52, W-14), cabMat.clone());
  hood.position.set(-155, 40, 0);
  truck.add(hood);

  // step running board under the cab door
  const stepMat = new THREE.MeshStandardMaterial({ color:0x1a1c22, roughness:.6, metalness:.4 });
  const step = new THREE.Mesh(new THREE.BoxGeometry(60, 6, W+6), stepMat);
  step.position.set(-85, 18, 0);
  truck.add(step);

  // chrome grille
  const grilleMat = new THREE.MeshStandardMaterial({ color:0xc7cbd1, roughness:.15, metalness:.85 });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(6, 40, W-32), grilleMat);
  grille.position.set(-180, 36, 0);
  truck.add(grille);
  for (let i=-2;i<=2;i++){
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3, 3, W-40), grilleMat);
    bar.position.set(-177, 36 + i*8, 0);
    truck.add(bar);
  }

  // front bumper
  const bumperMat = new THREE.MeshStandardMaterial({ color:0x16171a, roughness:.6, metalness:.3 });
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(8, 18, W), bumperMat);
  bumper.position.set(-183, 10, 0);
  truck.add(bumper);

  // headlights
  const headlightMat = new THREE.MeshStandardMaterial({ color:0xfff3c4, emissive:0xffdd66, emissiveIntensity:.6, roughness:.3 });
  [W/2-16, -(W/2-16)].forEach(z=>{
    const hl = new THREE.Mesh(new THREE.BoxGeometry(4, 14, 20), headlightMat);
    hl.position.set(-181, 24, z);
    truck.add(hl);
  });

  // windshield + side windows + mirrors
  const glassMat = new THREE.MeshStandardMaterial({ color:0x9fc0ff, roughness:.1, metalness:.5, transparent:true, opacity:.65 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(30, 48, W-32), glassMat);
  windshield.position.set(-20, 110, 0);
  truck.add(windshield);
  [W/2-4, -W/2+4].forEach(z=>{
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(65, 42, 4), glassMat);
    sideWin.position.set(-100, 122, z);
    truck.add(sideWin);

    const armMat = new THREE.MeshStandardMaterial({ color:0x1c1f26, roughness:.6 });
    const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(2,2,26,8), armMat);
    mirrorArm.rotation.x = Math.PI/2.4;
    mirrorArm.position.set(-35, 130, z > 0 ? z+8 : z-8);
    truck.add(mirrorArm);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 20), armMat);
    mirror.position.set(-35, 130, z > 0 ? z+22 : z-22);
    truck.add(mirror);
  });

  // front (cab) single-wheel axle — same radius (R) and same ground-contact
  // height as the rear axles, aligned directly under the cab.
  makeWheel(-45, outerZ);
  makeWheel(-45, -outerZ);
  const frontAxleMat = new THREE.MeshStandardMaterial({ color:0x1c1e22, roughness:.6, metalness:.5 });
  const frontAxleRod = new THREE.Mesh(new THREE.CylinderGeometry(5,5, (outerZ*2)+20, 12), frontAxleMat);
  frontAxleRod.rotation.x = Math.PI/2;
  frontAxleRod.position.set(-45, R-4, 0);
  truck.add(frontAxleRod);

  containerGroup.add(truck);
}

/* --- Dimension arrows/labels using CSS overlay badges positioned via projection --- */
let dimBadgeEls = [];
function buildDimensionAnnotations(){
  dimBadgeEls.forEach(e=>e.remove());
  dimBadgeEls = [];
  const L = TRUCK_DIM_CM.length, W = TRUCK_DIM_CM.width, H = TRUCK_DIM_CM.height;
  addDimBadge(L+' cm', new THREE.Vector3(L/2, H+20, 0));
  addDimBadge(H+' cm', new THREE.Vector3(L+40, H/2, W/2+10));
  addDimBadge(W+' cm', new THREE.Vector3(L+40, 10, 0));
}
function addDimBadge(text, pos3d){
  const el = document.createElement('div');
  el.className = 'dim-badge';
  el.textContent = text;
  el.dataset.x = pos3d.x; el.dataset.y = pos3d.y; el.dataset.z = pos3d.z;
  els.threeContainer.appendChild(el);
  dimBadgeEls.push(el);
}
function updateDimBadgePositions(){
  const rect = els.threeContainer.getBoundingClientRect();
  dimBadgeEls.forEach(el=>{
    const v = new THREE.Vector3(+el.dataset.x, +el.dataset.y, +el.dataset.z);
    v.project(camera);
    const x = (v.x*0.5+0.5) * rect.width;
    const y = (-v.y*0.5+0.5) * rect.height;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = (v.z < 1) ? 'block' : 'none';
  });
  requestAnimationFrame(updateDimBadgePositions);
}

/* ======================================================================
   3D UNIT-BY-UNIT SHELF PACKING
   Every individual unit box is placed one at a time and checked against the
   truck's real length/width/height as it's placed — so nothing can ever be
   sized or positioned outside the truck, regardless of quantity. Boxes fill
   left-to-right across the width, then advance deeper into the truck
   (length) row by row, and only start a new vertical layer once a full
   floor row genuinely has no room left. Items are placed in order without
   resetting the cursor between items, so a new item continues immediately
   next to whatever's already loaded — never on top of it unless the floor
   is actually full. Editing an item's Qty simply re-runs this whole pack,
   so the visualization always matches the numbers in the items table.
   ====================================================================== */
let cargoGroup = null;
let placedBoxKeys = new Set(); // tracks which individual unit boxes already exist in the scene (persist position across re-renders so only *new* units fly in)

function packAndRenderCargo(){
  if (!threeReady || !containerGroup) return;
  if (!cargoGroup){
    cargoGroup = new THREE.Group();
    containerGroup.add(cargoGroup);
  }

  const items = getTruck().items;
  els.vizEmpty.style.display = items.length ? 'none' : 'flex';

  // full rebuild per refresh is fine (positions are deterministic/stable for
  // a given item order), but we must NOT re-animate boxes that already exist.
  while (cargoGroup.children.length){
    const child = cargoGroup.children[0];
    cargoGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) disposeMaterial(child.material);
  }
  if (!items.length){ placedBoxKeys = new Set(); return; }

  const L = TRUCK_DIM_CM.length, W = TRUCK_DIM_CM.width, H = TRUCK_DIM_CM.height;
  const PAD = 5;
  const FLOOR_MARGIN = 8;
  let cursorX = FLOOR_MARGIN, cursorZ = -W/2 + FLOOR_MARGIN, layerY = FLOOR_MARGIN;
  let rowDepth = 0, layerMaxHeight = 0;
  let truckIsFull = false;
  const MAX_RENDERED_PER_ITEM = 250; // render cap for performance — capacity math already uses the real qty

  items.forEach(it=>{
    if (truckIsFull) return;
    const unitsToRender = Math.min(it.qty, MAX_RENDERED_PER_ITEM);
    let firstUnitPos = null;

    for (let u=0; u<unitsToRender; u++){
      // wrap to the next row across the width if this unit doesn't fit
      if (cursorZ + it.wid + PAD > W/2){
        cursorZ = -W/2 + FLOOR_MARGIN;
        cursorX += rowDepth + PAD;
        rowDepth = 0;
      }
      // wrap to a new vertical layer if this row doesn't fit within the truck's length
      if (cursorX + it.len + PAD > L - FLOOR_MARGIN){
        cursorX = FLOOR_MARGIN;
        cursorZ = -W/2 + FLOOR_MARGIN;
        rowDepth = 0;
        layerY += layerMaxHeight + PAD;
        layerMaxHeight = 0;
      }
      // truck is completely full — stop placing (capacity math already
      // prevented this in normal use; this is just a hard safety net so
      // nothing can ever render outside the truck's real dimensions)
      if (layerY + it.hei > H){ truckIsFull = true; break; }

      const bx = cursorX + it.len/2;
      const by = layerY + it.hei/2;
      const bz = cursorZ + it.wid/2;
      if (!firstUnitPos) firstUnitPos = { x:bx, y:by, z:bz };

      const key = it.name.toLowerCase() + ':' + activeTruckId + ':' + u;
      const geo = new THREE.BoxGeometry(it.len - PAD, it.hei - PAD, it.wid - PAD);
      // the very first unit of each item carries its name stenciled on the
      // front face, so every item is clearly labeled on an actual box
      const mat = (u === 0)
        ? makeLabeledBoxMaterials(it.color, it.name, it.qty, it.qtyUnit)
        : new THREE.MeshStandardMaterial({ color: it.color, roughness:.55, metalness:.05 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bx, by, bz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      cargoGroup.add(mesh);

      if (!placedBoxKeys.has(key)){
        placedBoxKeys.add(key);
        animateBoxDropIn(mesh, by); // starts immediately — no staggered delay
      }

      cursorZ += it.wid + PAD;
      rowDepth = Math.max(rowDepth, it.len);
      layerMaxHeight = Math.max(layerMaxHeight, it.hei);
    }

    // floating name tag above this item's first unit, for readability from any angle
    if (firstUnitPos){
      const label = makeLabelSprite(it.name, it.qty + ' ' + it.qtyUnit, it.color);
      label.position.set(firstUnitPos.x, firstUnitPos.y + it.hei/2 + 20, firstUnitPos.z);
      cargoGroup.add(label);
    }
  });

  if (truckIsFull){
    flashOverCapacity();
  }

  // prune stale keys for THIS truck only (item removed from it) so a
  // removed-then-re-added item can play its drop-in animation again.
  const validPrefixes = new Set(items.map(it=>it.name.toLowerCase()+':'+activeTruckId));
  const truckKeySuffix = ':' + activeTruckId + ':';
  Array.from(placedBoxKeys).forEach(k=>{
    if (!k.includes(truckKeySuffix)) return; // not this truck, skip
    const prefix = k.split(':').slice(0,2).join(':');
    if (!validPrefixes.has(prefix)) placedBoxKeys.delete(k);
  });
}

/* Quick, smooth settle-in: the box appears in place and eases from a tiny
   scale up to full size in ~180ms — no staggered wait between boxes, no
   multi-hundred-millisecond crane-drop. The item shows up in the truck
   right away, with just enough motion to feel alive rather than a hard cut. */
function animateBoxDropIn(mesh, targetY){
  mesh.position.y = targetY;
  mesh.scale.set(0.001, 0.001, 0.001);
  const start = performance.now();
  const dur = 180;
  function step(t){
    const p = Math.min(1, (t-start)/dur);
    const eased = 1 - Math.pow(1-p, 3); // easeOutCubic — snappy, no bounce/lag
    mesh.scale.set(eased, eased, eased);
    if (p < 1) requestAnimationFrame(step);
    else mesh.scale.set(1,1,1);
  }
  requestAnimationFrame(step);
}

/* Builds the 6-material array for a unit box: 5 faces plain color, the
   camera-facing (+Z) front face gets the item name printed directly on it
   — so the name is clearly readable on the physical box, like a stenciled
   crate label. */
function makeLabeledBoxMaterials(hexColor, name, qty, qtyUnit){
  const plain = new THREE.MeshStandardMaterial({ color:hexColor, roughness:.55, metalness:.05 });

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0,0,512,512);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(14,14,484,484);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Segoe UI, Arial, sans-serif';
  wrapText(ctx, name, 256, 235, 440, 58);
  ctx.font = '600 36px Segoe UI, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.fillText(qty + ' ' + qtyUnit, 256, 320);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const labeled = new THREE.MeshStandardMaterial({ map: tex, roughness:.55, metalness:.05 });

  // BoxGeometry material order: [+x, -x, +y, -y, +z, -z]
  return [plain, plain, plain, plain, labeled, plain];
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '', lines = [];
  words.forEach(w=>{
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line){ lines.push(line); line = w; }
    else line = test;
  });
  lines.push(line);
  if (lines.length > 2){ lines = [lines[0], lines.slice(1).join(' ')]; } // cap at 2 lines
  const startY = y - ((lines.length-1)*lineHeight)/2;
  lines.forEach((l,i)=> ctx.fillText(l, x, startY + i*lineHeight));
}

function makeLabelSprite(title, subtitle, hexColor){
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,256,96);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Segoe UI, Arial, sans-serif';
  ctx.fillText(title, 128, 42, 236);
  ctx.font = '600 24px Segoe UI, Arial, sans-serif';
  ctx.fillStyle = '#e9edff';
  ctx.fillText(subtitle, 128, 74, 236);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent:true, depthTest:false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(140, 52, 1);
  return sprite;
}

function disposeMaterial(mat){
  if (Array.isArray(mat)){ mat.forEach(m=>{ if (m.map) m.map.dispose(); m.dispose(); }); }
  else { if (mat.map) mat.map.dispose(); mat.dispose(); }
}

/* ---------------- MASTER REFRESH ---------------- */
function refreshAll(){
  refreshCapacityUI();
  refreshItemsTable();
  try {
    packAndRenderCargo();
  } catch (err){
    console.error('Cargo packing/render error:', err);
    showThreeError('Could not place items in truck: ' + (err && err.message ? err.message : err));
  }
}

/* ---------------- FORM HANDLERS ---------------- */
els.addBtn.addEventListener('click', ()=>{
  els.formError.style.display = 'none';

  const bookingId = els.booking.value || 'BK-1001';
  const qty = parseFloat(els.qty.value);
  const len = parseFloat(els.len.value);
  const wid = parseFloat(els.wid.value);
  const hei = parseFloat(els.hei.value);
  const weight = parseFloat(els.weight.value) || 0;
  const rate = parseFloat(els.rate.value) || 0;
  const name = (els.item.value || '').trim();
  if (!name){ return formErr('Please enter an item name.'); }
  if (!qty || qty <= 0){ return formErr('Quantity must be greater than 0.'); }
  if (!len || !wid || !hei || len<=0 || wid<=0 || hei<=0){ return formErr('Please enter valid dimensions.'); }
  if (len > TRUCK_DIM_CM.length || wid > TRUCK_DIM_CM.width || hei > TRUCK_DIM_CM.height){
    return formErr('Item dimensions exceed truck cargo dimensions.');
  }

  const unitVolumeM3 = (len/100)*(wid/100)*(hei/100);
  const availableVolume = Math.max(0, TRUCK_VOLUME_M3 - computeUsedVolume());
  const maxUnitsThatFit = Math.floor(availableVolume / unitVolumeM3);

  if (maxUnitsThatFit <= 0){
    flashOverCapacity();
    showToast('⚠ Over Capacity — ' + activeTruckId + ' is full. Nothing was added.', 'error');
    return;
  }

  const qtyToStore = Math.min(qty, maxUnitsThatFit);
  const excess = qty - qtyToStore;
  const color = colorForItemName(name);

  // Merge into an existing entry with the SAME item name (case-insensitive)
  // already on this truck: quantity is added to it and the space calculation
  // updates automatically, instead of creating a duplicate row.
  const existing = getTruck().items.find(it => it.name.toLowerCase() === name.toLowerCase());

  // NOTE: nothing is written to Zoho Creator here — items only live
  // locally until the "Save Shipment" button is clicked (see
  // saveShipmentToZoho() further down). recordId stays null until the
  // first successful save; _qtyDirty flags a quantity change on an
  // item that was already saved, so Save Shipment knows to update it
  // instead of creating a duplicate.
  if (existing){
    existing.qty += qtyToStore;
    existing.len = len; existing.wid = wid; existing.hei = hei;
    existing.unitVolumeM3 = unitVolumeM3;
    existing.weight = weight; existing.rate = rate;
    existing.hub = els.hub.value; existing.pkgType = els.pkg.value;
    existing.qtyUnit = els.qtyUnit.value;
    existing.bookingId = bookingId;
    existing.bookingRecordId = currentBookingRecordId;
    existing.shipmentId = existing.shipmentId || generateShipmentId();
    if (els.remarks.value) existing.remarks = els.remarks.value;
    if (existing.recordId) existing._qtyDirty = true; // already saved once — flag for update on next Save Shipment
  } else if (qtyToStore > 0){
    const newItem = {
      recordId: null,       // set once saveShipmentToZoho() creates it in Zoho Creator
      _qtyDirty: false,
      shipmentId: generateShipmentId(),
      name, bookingId, bookingRecordId: currentBookingRecordId,
      hub: els.hub.value, qty: qtyToStore, qtyUnit: els.qtyUnit.value,
      pkgType: els.pkg.value, weight, rate,
      len, wid, hei, unitVolumeM3, color,
      remarks: els.remarks.value
    };
    getTruck().items.push(newItem);
  }

  if (excess > 0){
    flashOverCapacity();
    showToast('⚠ Over Capacity — only ' + qtyToStore + ' of ' + qty + ' ' + els.qtyUnit.value + ' fit. ' + excess + ' ' + els.qtyUnit.value + ' were NOT stored.', 'error');
  } else {
    showToast((existing ? 'Added ' + qtyToStore + ' more — ' : 'Item added — ') + 'now ' + (existing ? existing.qty : qtyToStore) + ' on ' + activeTruckId, 'success');
  }

  refreshAll();
  resetForm(false);
});

function flashOverCapacity(){
  els.overCapBanner.classList.add('show');
  clearTimeout(flashOverCapacity._t);
  flashOverCapacity._t = setTimeout(()=> els.overCapBanner.classList.remove('show'), 4000);
}

els.resetBtn.addEventListener('click', ()=> resetForm(true));

function resetForm(notify){
  els.item.value = '';
  els.hub.selectedIndex = 0;
  els.qty.value = 10;
  els.qtyUnit.selectedIndex = 0;
  els.pkg.selectedIndex = 0;
  els.weight.value = 250;
  els.rate.value = 2.50;
  els.len.value = 100;
  els.wid.value = 50;
  els.hei.value = 50;
  els.remarks.value = '';
  els.formError.style.display = 'none';
  if (notify) showToast('Form reset');
}

function formErr(msg){
  els.formError.textContent = msg;
  els.formError.style.display = 'block';
  els.formError.classList.remove('shake');
  void els.formError.offsetWidth; // restart animation
  els.formError.classList.add('shake');
}

/* ---------------- INIT ---------------- */
let threeReady = false;

function attemptThreeInit(retriesLeft){
  const hasSize = els.threeContainer.clientWidth > 0 && els.threeContainer.clientHeight > 0;
  if (!hasSize && retriesLeft > 0){
    // container not laid out yet (common right after a widget is mounted
    // inside Zoho Creator's iframe) — wait a beat and try again.
    setTimeout(()=> attemptThreeInit(retriesLeft - 1), 100);
    return;
  }
  threeReady = initThree();
  if (threeReady) updateDimBadgePositions();
  refreshAll();
}

/* ======================================================================
   SAVE SHIPMENT — syncs everything to Zoho Creator's Shipment_Items form,
   only when this button is clicked (never on Add/Qty-edit/Remove).
   - New items (recordId == null)      -> addRecord      (create)
   - Edited items (_qtyDirty == true)  -> updateRecordById (Quantity only)
   - Removed items (queued while saved)-> deleteRecordById (delete)
   Every created item's recordId is stored back onto it, so re-clicking
   Save Shipment (or editing again afterwards) never creates a duplicate
   — an item is only ever addRecord'd once.
   ====================================================================== */

/* Builds the exact field payload for Shipment_Items, matching the field
   link names from the form definition you supplied. */
function buildShipmentItemPayload(item){
  return {
    [ZOHO_CONFIG.f_item]: item.name,
    [ZOHO_CONFIG.f_hub]: hubOptionsMap[item.hub] || item.hub,
    [ZOHO_CONFIG.f_qty]: item.qty,
    [ZOHO_CONFIG.f_pkgType]: item.pkgType,
    [ZOHO_CONFIG.f_weight]: item.weight,
    [ZOHO_CONFIG.f_rate]: item.rate,
    [ZOHO_CONFIG.f_length]: item.len,
    [ZOHO_CONFIG.f_width]: item.wid,
    [ZOHO_CONFIG.f_height]: item.hei,
    [ZOHO_CONFIG.f_remarks]: item.remarks || "",
    [ZOHO_CONFIG.f_bookingLookup]: item.bookingRecordId || currentBookingRecordId || ""
  };
}

async function saveShipmentToZoho(){
  if (!(window.ZOHO && ZOHO.CREATOR)){
    showToast('⚠ Not running inside Zoho Creator — nothing to sync.', 'error');
    return;
  }
  if (isSavingShipment) return; // guards against double-click / duplicate submits
  isSavingShipment = true;
  els.saveBtn.disabled = true;
  const originalLabel = els.saveBtn.textContent;
  els.saveBtn.textContent = 'Saving…';

  try {
    // 1) Deletes first — items removed locally that already existed in Zoho.
    for (const recId of pendingDeletes){
      await ZOHO.CREATOR.API.deleteRecordById({
        appName: ZOHO_CONFIG.appName,
        reportName: ZOHO_CONFIG.shipmentItemsReport,
        id: recId
      });
    }
    pendingDeletes = [];

    // 2) Creates (new items) + updates (dirty quantities) across every
    // truck currently tracked in state.
    for (const truckId in trucks){
      for (const item of trucks[truckId].items){
        if (!item.recordId){
          const res = await ZOHO.CREATOR.API.addRecord({
            appName: ZOHO_CONFIG.appName,
            formName: ZOHO_CONFIG.shipmentItemsForm,
            data: buildShipmentItemPayload(item)
          });
          const newId = res && res.data && (res.data.ID || res.data.id);
          if (newId){ item.recordId = newId; }
          item._qtyDirty = false;
        } else if (item._qtyDirty){
          await ZOHO.CREATOR.API.updateRecordById({
            appName: ZOHO_CONFIG.appName,
            reportName: ZOHO_CONFIG.shipmentItemsReport,
            id: item.recordId,
            data: { [ZOHO_CONFIG.f_qty]: item.qty }
          });
          item._qtyDirty = false;
        }
      }
    }

    showToast('✔ Shipment saved to Zoho Creator', 'success');
    refreshAll();
    setTimeout(closeWidgetPage, 900); // let the success toast be visible briefly first
  } catch (err){
    console.error('Save Shipment failed:', err);
    showToast('⚠ Save failed — check the browser console for details', 'error');
  } finally {
    isSavingShipment = false;
    els.saveBtn.disabled = false;
    els.saveBtn.textContent = originalLabel;
  }
}
els.saveBtn.addEventListener('click', saveShipmentToZoho);

/* Closes the widget/page after a successful save. Zoho Creator's widget
   SDK doesn't currently expose a documented "close this page" call the
   way the CRM embedded SDK does, so this uses window.close() — which
   works when the widget was opened as a popup/new tab by a custom
   button (the common setup for this kind of add-item flow). If your
   button instead embeds the widget inline on a page, window.close() will
   be silently blocked by the browser; in that case swap this for
   whatever your button is configured to do on completion (e.g. a
   ZOHO.CREATOR.UTIL redirect, or leave the page as-is and rely on the
   success toast). */
function closeWidgetPage(){
  try {
    window.close();
  } catch (err){
    console.warn('Could not auto-close the window:', err);
  }
  // Fallback message in case window.close() was blocked (browsers only
  // allow it for windows opened via script) so the user isn't left
  // guessing whether the save actually completed.
  setTimeout(()=>{
    if (!window.closed){
      showToast('Saved — you can close this window now.', 'success');
    }
  }, 300);
}

window.addEventListener('load', ()=>{
  attemptThreeInit(20); // retries for up to ~2s while the container sizes itself
  zohoInitAndLoad();    // pulls Trip -> Booking -> Hub/Vehicle/Capacity live data
});