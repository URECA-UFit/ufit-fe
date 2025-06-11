<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-button" @click="close">✕</button>
      <h2>챗봇 리뷰 작성</h2>

      <div class="star-rating">
        <span
          v-for="index in 5"
          :key="index"
          class="star"
          :class="{ filled: index <= rating }"
          @click="setRating(index)"
        >
          ★
        </span>
      </div>

      <textarea
        v-model="reviewText"
        placeholder="챗봇에 대한 의견을 작성해주세요..."
        rows="5"
      ></textarea>

      <div class="modal-buttons">
        <button @click="submit">제출</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";

const emit = defineEmits(["close", "submit"]);
const rating = ref(5);
const reviewText = ref("");

const close = () => {
  emit("close");
};

const submit = () => {
  emit("submit", {
    rating: rating.value,
    review: reviewText.value,
  });
  rating.value = 5;
  reviewText.value = "";
  emit("close");
};

const setRating = (value) => {
  rating.value = value;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(33, 33, 33, 0.5); /* 212121 + 투명도 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px 24px 24px;
  border-radius: 16px;
  width: 360px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-family: "Pretendard", sans-serif;

  display: flex;
  flex-direction: column;
  text-align: center;
}

/* 닫기 버튼 */
.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: none;
  font-size: 20px;
  font-weight: bold;
  color: #b3006d;
  cursor: pointer;
}

/* 별점 */
.star-rating {
  margin: 12px 0 20px;
  text-align: center;
}

.star {
  font-size: 30px;
  color: #d9d9d9;
  cursor: pointer;
  transition: color 0.2s;
}

.star.filled {
  color: #ec008c;
}

/* 텍스트 영역 */
textarea {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  resize: none;
  margin-bottom: 20px;
  align-self: center;
  font-family: inherit;
}

/* 제출 버튼 */
.modal-buttons {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.modal-buttons button {
  background-color: #ec008c;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.modal-buttons button:hover {
  background-color: #b3006d;
}
</style>
