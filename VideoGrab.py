import numpy as np
import cv2
#lectura de video grabado
#video=cv2.VideoCapture('videograb.avi')


#grabamos el video en 10 segundo con una resolucion de 649 x 480
video=cv2.VideoCapture(0)
# para leer el video se debe comentar esta linea donde indicamos las captura de la imagen
videoGrab = cv2.VideoWriter('videograb.avi',cv2.VideoWriter_fourcc(*'xvid'),10.0,(640,480))
while  (video.isOpened()):
    ret,frame1=video.read()
    if ret == True:
    #llevamos nuestro video a escala de grises.
     gray = cv2.cvtColor(frame1,cv2.COLOR_RGB2GRAY)
    #convetimos el frame a float
    frame_float=gray.astype(float)
    #KERNEL DE SOBEL
    # kernel Sobel en eje-x, para detectar bordes horizontales
    sobelX = np.array((
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]), dtype="int")

    # kernel Sobel en eje-y, para detectar bordes verticales
    sobelY = np.array((
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]), dtype="int")
    bordex=cv2.filter2D(frame_float,-1,sobelX)
    bordey=cv2.filter2D(frame_float,-1,sobelY)
    #calculamos y llevamos nuestro kernel a operacion cuadratica.
    Mxy=bordex**2+bordey**2
    #ocupamos la funcion en numpy sqrt para realizar la operacion.
    Mxy=np.sqrt(Mxy)
    #NORMALIZACION
    Mxy=Mxy/np.max(Mxy)
    #rango escala de grises
    mask=np.where(Mxy > 0.1,255,0)
    mask=np.uint8(mask)
    cv2.imshow('BORDES',mask)
    #escribimos la salida del video
    videoGrab.write(frame1)
    k=cv2.waitKey(30)&0xFF
    if(k==ord('s')):
        break
video.release()
cv2.destroyAllWindows()
