---
title: 'Programación Dinámica: Conceptos, Enfoques y Casos Prácticos'
publishedAt: 2026-02-11
updatedAt: 2026-02-11
authors:
  - juan-carlos-angulo
heroImage: null
categoryTitle: CS Fundamentals
relatedPosts:
  - complejidad-algoritmica
  - algoritmos-estructuras-datos
sidebarBanners: []
metaTitle: 'Programación Dinámica: De la Recursión a la Optimización'
metaDescription: 'Aprende a resolver problemas complejos con programación dinámica. Cubrimos Memoización, Tabulación y el Problema de la Mochila.'
primary_keywords:
  - programación dinámica
  - algoritmos de optimización
  - técnica de memoización
semantic_keywords:
  - enfoque Top-Down vs Bottom-Up
  - subproblemas superpuestos
  - estructura óptima
  - tabulación en algoritmos
  - problema de la mochila
  - serie de Fibonacci optimizada
uploaded: false
---

La **programación dinámica (PD)** es una de las técnicas más temidas y, a la vez, más potentes de la informática. No es un paradigma de programación como la POO, sino una estrategia de optimización que reduce la complejidad de problemas exponenciales a tiempos lineales o polinomiales.

## El Core de la PD: No resolver lo que ya resolviste

La PD se basa en una idea simple: si un problema se puede dividir en subproblemas que se repiten (**Subproblemas Superpuestos**), podemos guardar la respuesta del primero y reutilizarla.

### ¿Qué es el "Estado" en PD?
Un estado es el conjunto de parámetros mínimos necesarios para identificar un subproblema de forma única. En el cálculo de rutas, el estado sería `(ciudad_actual, destino)`.

---

## Los Dos Enfoques de Implementación

### 1. Memoización (Top-Down)
Es la recursividad con memoria.
-   **Pros**: Más fácil de conceptualizar si ya tienes una solución recursiva.
-   **Cons**: Puede causar un **Stack Overflow** (desbordamiento de pila) si el problema es muy profundo.

### 2. Tabulación (Bottom-Up)
Es el enfoque iterativo usando una tabla (generalmente un array o matriz).
-   **Pros**: No usa la pila de recursión y suele ser más rápido y eficiente en memoria.
-   **Cons**: Requiere entender exactamente el orden en que se deben resolver los subproblemas.

---

## Caso de Estudio: El Problema de la Mochila (Knapsack)

Tienes una mochila con capacidad `W` y varios objetos con `peso` y `valor`. ¿Cómo maximizar el valor sin romper la mochila?

-   **Solución Recursiva**: Complejidad **O(2^n)**. Es inviable para más de 30 objetos.
-   **Solución con PD**: Usamos una matriz donde `dp[i][w]` representa el valor máximo usando los primeros `i` objetos con peso `w`. Complejidad: **O(n * W)**. Hemos transformado un problema imposible en uno que se resuelve en milisegundos.

```typescript
// Fragmento conceptual de Tabulación
for (let i = 1; i <= n; i++) {
  for (let w = 1; w <= capacidad; w++) {
    if (pesos[i-1] <= w) {
      dp[i][w] = Math.max(valores[i-1] + dp[i-1][w-pesos[i-1]], dp[i-1][w]);
    } else {
      dp[i][w] = dp[i-1][w];
    }
  }
}
```

---

## ¿Cuándo usar PD frente a División y Conquista?

-   **División y Conquista (Merge Sort)**: Los subproblemas son independientes (no se solapan).
-   **Programación Dinámica**: Los subproblemas se solapan. Si usas recursión simple, calcularás lo mismo miles de veces.

## Conclusión

La programación dinámica es la herramienta que separa a los ingenieros de software senior del resto. Es fundamental para optimizar motores de búsqueda, bioinformática (alineación de ADN) y logística. ¿Quieres entender la base matemática de por qué la PD ahorra tanto tiempo? Mira mi post sobre la [Complejidad Algorítmica](/cs-fundamentals/complejidad-algoritmica).
