---
title: 'Notación Big O: Guía de Complejidad Algorítmica con Ejemplos'
publishedAt: 2026-02-10T00:00:00.000Z
updatedAt: 2026-02-11T00:00:00.000Z
authors:
  - juan-carlos-angulo
heroImage: /images/blog/big-o-notation.webp
categoryTitle: CS Fundamentals
relatedPosts:
  - complejidad-algoritmica
  - algoritmos-estructuras-datos
sidebarBanners: []
metaTitle: 'Notación Big O: Tutorial y Guía de Escalabilidad de Código'
metaDescription: >-
  Aprende a medir la eficiencia de tu código. Guía completa sobre Notación Big
  O, complejidad temporal y espacial con ejemplos prácticos.
primary_keywords:
  - notación Big O
  - complejidad temporal
  - medir la eficiencia del código
semantic_keywords:
  - complejidad algorítmica
  - análisis de algoritmos
  - tiempo de ejecución
  - escalabilidad de algoritmos
  - eficiencia de algoritmos
  - notación asintótica
uploaded: true
idioma: es
slug: big-o-notation
---

La **Notación Big O** es el estándar de la industria para describir la eficiencia de un algoritmo. No mide el tiempo en milisegundos (que depende de tu procesador), sino la **tasa de crecimiento** de las operaciones a medida que los datos de entrada aumentan.

Si eres un desarrollador que aspira a niveles senior, Big O es tu herramienta para predecir si tu código colapsará cuando pases de 100 a 1,000,000 de usuarios.

## ¿Qué significa realmente Big O?

En ingeniería, nos interesa el **límite superior** del rendimiento. Decir que un algoritmo es **O(n)** significa que, en el peor de los casos, el número de pasos que dará es proporcional al número de elementos que procesa.

### Reglas de Oro para el Cálculo:
1.  **Ignora las Constantes**: `O(2n)` se simplifica a `O(n)`. A gran escala, el factor `2` es despreciable.
2.  **Quédate con el Término Dominante**: Si un algoritmo hace `n + n²` operaciones, su complejidad es `O(n²)`. El término más lento es el que define la escalabilidad.
3.  **Múltiples Variables**: Si procesas dos listas diferentes, la complejidad es **O(a + b)**, no O(n).

---

## Clases de Complejidad (Ordenadas por Eficiencia)

### O(1) - Complejidad Constante
Es el ideal máximo. El tiempo es el mismo sin importar si tienes 1 o 1 billón de datos.
-   *Ejemplo*: Acceder a un elemento de un array por su índice.

### O(log n) - Complejidad Logarítmica
El tiempo crece muy lentamente. Es típico de algoritmos que dividen el problema a la mitad en cada paso.
-   *Ejemplo*: **Búsqueda Binaria**.

### O(n) - Complejidad Lineal
El tiempo es directamente proporcional a la entrada.
-   *Ejemplo*: Un bucle `for` simple buscando un valor en una lista.

### O(n log n) - Complejidad Log-Lineal
Es la mejor complejidad posible para algoritmos de ordenamiento general.
-   *Ejemplo*: Merge Sort y Quick Sort.

### O(n²) - Complejidad Cuadrática
El rendimiento cae drásticamente. Típico de bucles anidados.
-   *Ejemplo*: Comparar cada elemento de una lista con todos los demás.

---

## Complejidad Espacial: No todo es Tiempo
Un desarrollador profesional también mide cuánta **memoria** adicional consume el código.
-   Si creas un nuevo array del mismo tamaño que el original, tu complejidad espacial es **O(n)**.
-   Si ordenas el array original sin crear copias, es **O(1)**.

---

## ¿Qué es la Complejidad Amortizada?
Es un concepto avanzado para operaciones que son rápidas casi siempre, pero lentas ocasionalmente.
-   *Ejemplo*: Insertar en un `ArrayList`. Es `O(1)` normalmente, pero cuando el array interno se llena, debe copiarse entero a un nuevo bloque de memoria (`O(n)`). Sin embargo, en promedio, se considera **O(1) amortizado**.

## Conclusión
Dominar Big O te permite comunicarte con otros ingenieros usando un lenguaje técnico preciso. Te ayuda a elegir entre una **Tabla Hash** (O(1)) y un **Array** (O(n)) basándote en datos, no en intuición. ¿Listo para aplicar esto? Mira cómo afecta a la [Complejidad Algorítmica](/cs-fundamentals/complejidad-algoritmica) general de tus sistemas.
