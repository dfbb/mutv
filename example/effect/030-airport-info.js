BL.register({
  id: '030',
  name: '030 Airport info',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 30,
  src: 'Airport info · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=VT323&display=swap");
.bl-wrap {
  background: #C2BEB2;
}

.table {
  width: 790px;
  height: 150px;
  background-color: #d4e5ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.monitor-wrapper {
  background: #050321;
  width: 770px;
  height: 130px;
  box-shadow: 0px 2px 2px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.monitor {
  width: 700px;
  height: 100px;
  background-color: #344151;
  overflow: hidden;
  white-space: nowrap;
  box-shadow: inset 0px 5px 10px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.monitor p {
  font-family: "VT323", monospace;
  font-size: 100px;
  position: relative;
  display: inline-block;
  animation: move 20s infinite linear;
  color: #EBB55F;
}

@keyframes move {
  from {
    left: 800px;
  }
  to {
    left: -4800px;
  }
}`,
  html: `<div class="table">
  <div class="monitor-wrapper">
    <div class="monitor">
      <p>{{LINE}}</p>
    </div>
  </div>
</div>`
});
